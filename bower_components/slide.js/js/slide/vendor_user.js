import api from './api';
import Storage from './storage';
import User from './user';

var VendorUser = function(uuid) {
  this.uuid = uuid;
};

VendorUser.prototype.fromObject = function(obj) {
  $.extend(this, obj);
};

VendorUser.prototype.load = function(cb) {
  var self = this;
  api.get('/vendor_users/' + this.uuid,
    { success: function(vendor) {
      self.fromObject(vendor);
      cb(self);
    }});
};

VendorUser.prototype.getVendorKey = function(privateKey) {
  console.log(this);
  return Slide.crypto.decryptStringWithPackedKey(this.vendorKey, privateKey);
};

VendorUser.load = function(fail, success) {
  Storage.access("vendor-user", function(vendorUser) {
    if( Object.keys(vendorUser).length > 0 ) {
      vendorUser = new VendorUser(vendorUser.uuid).fromObject(vendorUser);
      success(vendorUser);
    } else {
      fail(success);
    }
  });
};
VendorUser.persist = function(vendorUser) {
  Storage.persist("vendor-user", vendorUser);
};

VendorUser.createRelationship = function(user, vendor, cb) {
  var keys;
  Slide.crypto.generateKeys(function(k) {
    keys = k;
  });

  var key = Slide.crypto.AES.generateKey();
  var userKey = Slide.crypto.encryptStringWithPackedKey(key, user.publicKey);
  var vendorKey = Slide.crypto.encryptStringWithPackedKey(key, vendor.publicKey);
  var checksum = Slide.crypto.encryptStringWithPackedKey('', user.publicKey);

  api.post('/vendors/'+vendor.id+'/vendor_users', {
    data: {
      key: userKey, 
      public_key: user.publicKey,
      checksum: checksum,
      vendor_key: vendorKey
    },
    success: function(resp) {
      resp.checksum = checksum;
      resp.privateKey = user.privateKey;
      resp.generatedKey = key;

      var vendorUser = new VendorUser(resp.uuid);
      vendorUser.fromObject(resp);
      VendorUser.persist(vendorUser);
      cb && cb(vendorUser);
    }
  });
};

VendorUser.prototype.loadVendorForms = function(cb) {
  api.get('/vendor_users/' + this.uuid + '/vendor_forms', {
    success: function(vendorForms) {
      var vendorFormHash = {};
      vendorForms.forEach(function(vf) {
        var vendorForm = Slide.VendorForm.fromObject(vf);
        vendorFormHash[vendorForm.name] = vendorForm;
      });
      cb(vendorFormHash);
    }
  });
};

$.extend(VendorUser.prototype, User.prototype);

export default VendorUser;

