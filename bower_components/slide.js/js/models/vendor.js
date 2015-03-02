import API from '../utils/api';
import Crypto from '../utils/crypto';
import Storage from '../utils/storage';
import VendorForm from './vendor-form';
import VendorUser from './vendor-user';
import User from './user';

var Vendor = function (name, chk, id, keys) {
  if (keys) {
    this.publicKey = keys.pub;
    this.privateKey = keys.priv;
    this.symmetricKey = keys.sym;
    this.checksum = chk || this.checksum();
  }
  this.name = name;
  this.id = id;
};

$.extend(Vendor.prototype, User.prototype);

Vendor.prototype.persist = function () {
  var obj = {
    id: this.id,
    name: this.name,
    publicKey: this.publicKey,
    privateKey: this.privateKey,
    symmetricKey: this.symmetricKey,
    checksum: this.checksum
  };
  Storage.persist('vendor', obj);
};

Vendor.fromObject = function (obj) {
  var keys = { pub: obj.publicKey || obj.public_key, priv: obj.privateKey, sym: obj.symmetricKey };
  var vendor;
  if( keys.pub || keys.priv || keys.sym ) {
    vendor = new Vendor(obj.name, obj.checksum, obj.id, keys);
  } else {
    vendor = new Vendor(obj.name, obj.checksum, obj.id);
  }
  vendor.invite = obj.invite_code;

  if (obj.signup_form) {
    vendor.signupForm = VendorForm.fromObject(obj.signup_form);
  }

  return vendor;
};

Vendor.all = function (cb) {
  API.get('/vendors', {
    success: function (vendors) {
      cb(vendors.map(Vendor.fromObject));
    }
  });
};

Vendor.load = function (fail, success) {
  Storage.access('vendor', function(vendor) {
    if( Object.keys(vendor).length > 0 ) {
      success(Vendor.fromObject(vendor));
    } else {
      fail(success);
    }
  });
};

Vendor.invite = function (name, cb) {
  API.post('/admin/vendors', {
    data: { name: name },
    success: function (vendor) {
      cb(Vendor.fromObject(vendor));
    }
  });
};

Vendor.prototype.register = function (cb) {
  var invite = this.invite, id = this.id, keys = Crypto.generateKeysSync();
  this.generate();
  this.checksum = this.getChecksum();
  var self = this;
  API.put('/vendors/' + id, {
    data: {
      invite_code: invite,
      key: this.prettyKey(),
      public_key: keys.publicKey,
      checksum: this.prettyChecksum()
    },
    success: function (v) {
      self.id = v.id;
      if (cb) { cb(self); }
    }
  });
};

Vendor.prototype.listen = function (cb) {
  var socket = API.socket('/vendors/' + this.id + '/listen');
  socket.onmessage = function (event) {
    cb(event.data);
  };
};

Vendor.prototype.createForm = function (name, description, formFields, cb) {
  API.post('/vendors/' + this.id + '/vendor_forms', {
    data: {
      name: name,
      description: description,
      form_fields: formFields,
      checksum: this.prettyChecksum()
    },
    success: function (form) {
      if (cb) { cb(VendorForm.fromObject(form)); }
    }
  });
};

Vendor.prototype.loadForms = function(cb) {
  API.get('/vendors/' + this.id + '/vendor_forms', {
    data: { checksum: this.prettyChecksum() },
    success: function(forms) {
      cb(forms);
    }
  });
};

Vendor.prototype.getProfile = function(success, fail) {
  API.get('/vendors/' + this.id + '/profile', {
    data: { checksum: this.prettyChecksum() },
    success: success,
    fail: fail
  });
};

Vendor.prototype.getUsers = function(success, fail) {
  API.get('/vendors/' + this.id + '/vendor_users', {
    data: { checksum: this.prettyChecksum() },
    success: function(x) { success(x); },
    fail: function(x) { fail(x); }
  });
};

Vendor.prototype.getKeyForVendorUser = function (vendorUser) {
  return this.decrypt(vendorUser.vendor_key);
};

Vendor.prototype.getResponsesForForm = function (form, cb) {
  var self = this;
  VendorForm.get(self, form.id, function (vendorForm) {
    var deferreds = [];
    var responses = [];

    for (var uuid in vendorForm.responses) {
      var userResponses = vendorForm.responses[uuid];
      var deferred = new $.Deferred();
      deferreds.push(deferred);

      new VendorUser(uuid).load(function (vendorUser) {
        var key = self.getKeyForVendorUser(vendorUser);
        var fields = Crypto.AES.decryptData(userResponses, key);

        var clean = {};
        for (var k in fields) {
          clean[k.replace(/\//g, '.')] = fields[k];
        }

        responses.push({ user: vendorUser, fields: clean });
        deferred.resolve();
      });

      $.when.apply($, deferreds).done(function () {
        cb(responses);
      });
    }
  });
};


export default Vendor;
