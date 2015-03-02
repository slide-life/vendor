import API from '../utils/api';
import Storage from '../utils/storage';
import Securable from './securable';
import Crypto from '../utils/crypto';

var User = function(number, pub, priv, key) {
  this.number = number;
  this.publicKey = pub;
  this.privateKey = priv;
  this.symmetricKey = key;
};

$.extend(User.prototype, Securable.prototype);

User.prototype.getId = function() {
  return this.number;
};
User.prototype.getDevice = function() {
  return { type: 'user', number: this.number, key: this.publicKey };
};
User.serializeProfile = function(patch) {
  var prepped = {};
  for( var k in patch ) {
    prepped[k.replace(/\./g, '/')] = JSON.stringify(patch[k]);
  }
  return prepped;
};
User.deserializeProfile = function(patch) {
  var prepped = {};
  for( var k in patch ) {
    prepped[k.replace(/\//g, '.')] = JSON.parse(patch[k]);
  }
  return prepped;
};

User.prompt = function(cb) {
  var user = new this();
  var form = $('<form><input type="text"><input type="submit" value="Send"></form>');
  $('#modal .modal-body').append(form);
  form.submit(function(evt) {
    evt.preventDefault();
    var number = $(this).find('[type=text]').val();
    API.get('/users/' + number + '/public_key', {
      success: function(resp) {
        var key = resp.public_key;
        user.number = number;
        user.symmetricKey = key;
        cb.call(user, number, key);
      }
    });
  });
  $('#modal').modal('toggle');
  return user;
};

User.fromObject = function(obj) {
  return new this(obj.number, obj.publicKey, obj.privateKey, obj.symmetricKey);
};

User.prototype.get = function(cb) {
  var self = this;
  API.get('/users/' + this.number, {
    success: function(data) {
      cb(data);
    }
  });
};

User.prototype.persist = function() {
  var obj = {
    number: this.number,
    publicKey: this.publicKey,
    privateKey: this.privateKey,
    symmetricKey: this.symmetricKey
  };
  Storage.persist('user', obj);
};

User.prototype.loadRelationships = function(success) {
  var self = this;
  API.get('/users/' + this.number + '/vendor_users', {
    success: function (data) {
      var uuids = Crypto.AES.decrypt(data, self.symmetricKey);
      var encryptedUuids;
      try {
        encryptedUuids = JSON.parse(uuids || '[]');
      } catch(e) {
        encryptedUuids = uuids;
      }
      var vendorUsers = encryptedUuids.map(function(uuid) {
        return new Slide.VendorUser(uuid);
      });
      var count = 0;
      if( vendorUsers.length == 0 ) {
        success([]);
      }
      vendorUsers.forEach(function(vu){
        vu.load(function() {
          if( count + 1 == vendorUsers.length ) {
            success(vendorUsers);
          } else {
            count++;
          }
        });
      });
    }
  });
};

User.loadFromStorage = function (success, fail) {
  Storage.access('user', function(user) {
    if( Object.keys(user).length > 0 ) {
      user = User.fromObject(user);
      user.loadRelationships(function(relationships) {
        user.relationships = relationships;
        user.forms = [];
        if( relationships.length == 0 ) {
          success(user);
        } else {
          var count = 0;
          relationships.forEach(function(rel) {
            rel.loadVendorForms(function(forms) {
              user.forms.concat(forms);
              if( count + 1 == relationships.length ) {
                success(user);
              } else {
                count++;
              }
            });
          });
        }
      });
    } else {
      fail(success);
    }
  });
};

User.load = function(number, cb) {
  var self = this;
  this.loadFromStorage(cb, function () {
    number(function(number) {
      self.register(number, function(user) {
        user.persist();
        cb(user);
      });
    });
  });
};

User.register = function(number, cb, fail) {
  var user = new User();
  user.generate();
  user.number = number;
  API.post('/users', {
    data: {
      key: user.prettyKey(),
      public_key: user.prettyPublicKey(),
      user: number
    },
    success: function (u) {
      user.id = u.id;
      if (cb) { cb(user); }
    },
    failure: function(error) {
      fail(error);
    }
  });
};

User.prototype.addRequest = function(uuid, cb) {
  // TODO: NB: vendor users are overwritten, not appended
  API.patch('/users/' + this.number + '/profile', {
    data: {
      patch: {_vendor_users: Crypto.AES.encrypt(JSON.stringify([uuid]), this.symmetricKey)}
    }, success: function(profile) {
      cb();
    }
  });
};

User.prototype.getProfile = function(cb) {
  var self = this;
  API.get('/users/' + this.number + '/profile', {
    success: function(data) {
      cb(self.decryptData(data));
    }
  });
};

User.prototype.patchProfile = function(patch, cb) {
  var self = this;
  API.patch('/users/' + this.number + '/profile', {
    data: { patch: this.encryptData(patch) },
    success: function (user) {
      if (cb) { cb(self.decryptData(user.profile)); }
    }
  });
};

User.prototype.listen = function(cb) {
  var socket = API.socket('/users/' + this.number + '/listen');
  socket.onmessage = function (event) {
    var message = JSON.parse(event.data);
    if (message.verb === 'verb_request') {
      cb(message.payload.blocks, message.payload.conversation);
    } else {
      var data = message.payload.fields;
      cb(this.decryptData(data));
    }
  };
};

User.prototype.requestPrivateKey = function(cb) {
  var actor = new Slide.Actor();
  var self = this;
  actor.openRequest(['private-key'], this.number, this.symmetricKey, function(fields) {
    cb.call(self, fields['private-key']);
  });
};


export default User;
