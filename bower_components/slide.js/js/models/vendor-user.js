import API from '../utils/api';
import Crypto from '../utils/crypto';
import Storage from '../utils/storage';
import User from './user';

var VendorUser = function(uuid) {
  this.uuid = uuid;
};

VendorUser.prototype.fromObject = function(obj) {
  for( var k in obj )
    this[k] = obj[k];
};

VendorUser.prototype.load = function(cb) {
  var self = this;
  API.get('/vendor_users/' + this.uuid,
    { success: function(vendor) {
      self.fromObject(vendor);
      cb(self);
    }});
};

VendorUser.prototype.getVendorKey = function(privateKey) {
  return Crypto.decrypt(this.vendorKey, privateKey);
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
  var keys = Crypto.generateKeysSync();

  var key = Crypto.AES.generateKey();
  var userKey = Crypto.AES.encryptKey(key, user.publicKey);
  var vendorKey = Crypto.AES.encryptKey(key, vendor.publicKey);
  var checksum = Crypto.encrypt('', user.publicKey);

  API.post('/vendors/'+vendor.id+'/vendor_users', {
    data: {
      key: Crypto.AES.prettyKey(userKey),
      public_key: user.publicKey,
      checksum: vendor.prettyChecksum(),
      login_checksum: Crypto.prettyPayload(checksum),
      vendor_key: Crypto.prettyPayload(vendorKey)
    },
    success: function(resp) {
      resp.checksum = checksum;
      resp.privateKey = user.privateKey;
      resp.generatedKey = key;
      resp.vendorKey = vendorKey;

      var vendorUser = new VendorUser(resp.uuid);
      vendorUser.fromObject(resp);
      // VendorUser.persist(vendorUser);
      cb && cb(vendorUser);
    }
  });
};

VendorUser.prototype.loadVendorForms = function(cb) {
  API.get('/vendor_users/' + this.uuid + '/vendor_forms', {
    data: { checksum: this.checksum ? Crypto.prettyPayload(this.checksum) : this.checksum },
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

