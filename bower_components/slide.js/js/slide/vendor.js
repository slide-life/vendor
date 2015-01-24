import api from './api';
import User from './user';
import Storage from './storage';

var Vendor = function (name, chk, id, keys) {
  if (keys) {
    this.publicKey = keys.pub;
    this.privateKey = keys.priv;
    this.symmetricKey = keys.sym;
    this.checksum = chk || Slide.crypto.encryptStringWithPackedKey('', keys.pub);
  }
  this.name = name;
  this.id = id;
};

$.extend(Vendor.prototype, User.prototype);

Vendor.prototype.persist = function () {
  var obj = {
    number: this.number,
    publicKey: this.publicKey,
    privateKey: this.privateKey,
    symmetricKey: this.symmetricKey,
    checksum: this.checksum,
    id: this.id
  };
  Storage.persist("vendor", obj);
};

Vendor.fromObject = function (obj) {
  var keys = { pub: obj.publicKey, priv: obj.privateKey, sym: obj.symmetricKey };
  var vendor;
  if( keys.pub || keys.priv || keys.sym ) {
    vendor = new Vendor(obj.name, obj.checksum, obj.id, keys);
  } else {
    vendor = new Vendor(obj.name, obj.checksum, obj.id);
  }
  vendor.invite = obj.invite_code;
  return vendor;
};

Vendor.load = function (fail, success) {
  Storage.access("vendor", function(vendor) {
    if( Object.keys(vendor).length > 0 ) {
      success(Vendor.fromObject(vendor));
    } else {
      fail(success);
    }
  });
};

Vendor.invite = function (name, cb) {
  api.post('/admin/vendors', {
    data: { name: name },
    success: function (vendor) {
      cb(Vendor.fromObject(vendor));
    }
  });
};

Vendor.prototype.register = function (cb) {
  var invite = this.invite, id = this.id, keys;
  Slide.crypto.generateKeys(function (k) {
    keys = Slide.crypto.packKeys(k);
  });
  var symmetricKey = Slide.crypto.AES.generateKey();
  var key = Slide.crypto.encryptStringWithPackedKey(symmetricKey, keys.publicKey);
  this.publicKey = keys.publicKey;
  this.privateKey = keys.privateKey;
  this.symmetricKey = symmetricKey;
  this.checksum = Slide.crypto.encryptStringWithPackedKey('', keys.publicKey);
  var self = this;
  api.put('/vendors/' + id, {
    data: {
      invite_code: invite,
      key: key,
      public_key: keys.publicKey,
      checksum: this.checksum
    },
    success: function (v) {
      self.id = v.id;
      cb && cb(self);
    }
  });
};

Vendor.prototype.listen = function (cb) {
  var socket = api.socket('ws://', '/vendors/' + this.number + '/listen');
  socket.onmessage = function (event) {
    console.log('refresh');
  };
};

Vendor.prototype.createForm = function (name, formFields, cb) {
  api.post('/vendors/' + this.id + '/vendor_forms', {
    data: {
      name: name,
      form_fields: formFields,
      checksum: this.checksum
    },
    success: function (form) {
      cb && cb(Slide.VendorForm.fromObject(form));
    }
  });
};

Vendor.prototype.loadForms = function(cb) {
  api.get('/vendors/' + this.id + '/vendor_forms', {
    data: { checksum: this.checksum },
    success: function(forms) {
      cb(forms);
    }
  });
};

Vendor.prototype.getProfile = function(cb) {
  api.get('/vendors/' + this.id + '/profile', {
    data: { checksum: this.checksum },
    success: function(profile) {
      cb(profile);
    }
  });
};

Vendor.prototype.getUsers = function(cb) {
  api.get('/vendors/' + this.id + '/vendor_users', {
    data: { checksum: this.checksum },
    success: function(users) {
      cb(users);
    }
  });
};

export default Vendor;
