import API from '../utils/api';
import Crypto from '../utils/crypto';
import Storage from '../utils/storage';
import Securable from './securable';

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
  return { type: 'user', number: this.getId(), key: this.publicKey };
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

User.prototype.persist = function() {
  var obj = {
    number: this.number,
    publicKey: this.publicKey,
    privateKey: this.privateKey,
    symmetricKey: this.symmetricKey
  };
  Storage.persist("user", obj);
};

User.prototype.loadRelationships = function(success) {
  var self = this;
  API.get('/users/' + this.number + '/vendor_users', {
    success: function (encryptedUuids) {
      var uuids = encryptedUuids.map(function(encryptedUuid) {
        return this.decryptData(encryptedUuid);
      });
      var vendorUsers = uuids.map(function(uuid) {
        return Slide.VendorUser.new(uuid);
      });
      success(vendorUsers);
    }
  });
};

User.loadFromStorage = function (success, fail) {
  Storage.access('user', function(user) {
    if( Object.keys(user).length > 0 ) {
      user = User.fromObject(user);
      user.loadRelationships(function(relationships) {
        user.relationships = relationships;
        success(user);
      });
    } else {
      fail(success);
    }
  });
};

User.load = function(number, cb) {
  var self = this;
  this.loadFromStorage(cb, function () {
    self.register(number, cb);
  });
};

User.register = function(number, cb, fail) {
  var keys = Crypto.generateKeysSync();
  var user = new User();
  var symmetricKey = Crypto.AES.generateKey();
  user.generate();
  var key = user.encryptedSymmetricKey();
  user.number = number;
  API.post('/users', {
    data: {
      key: user.prettyKey(),
      public_key: user.prettyPublicKey(),
      user: number
    },
    success: function (u) {
      user.id = u.id;
      cb && cb(user);
    },
    failure: function(error) {
      fail(error);
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
      cb && cb(self.decryptData(user.profile));
    }
  });
};

User.prototype.listen = function(cb) {
  var socket = API.socket('/users/' + this.number + '/listen');
  var self = this;
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
