import API from '../utils/api';

var VendorForm = function(name, fields, vendorId) {
  this.name = name;
  this.fields = fields;
  this.vendor = vendorId;
};

VendorForm.get = function(vendor, id, cb) {
  API.get('/vendors/'+vendor.id+'/vendor_forms/' + id, {
    data: { checksum: vendor.checksum },
    success: function(vendor) {
      cb(VendorForm.fromObject(vendor));
    }
  });
};

VendorForm.prototype.initialize = function(cb) {
  // TODO: perhaps allow a vendor form to be posted after the fact
};

VendorForm.fromObject = function(obj) {
  var form = new VendorForm(obj.name, obj.form_fields, obj.vendor_id);
  form.vendor_key = obj.vendor_key;
  form.id = obj.id;
  form.responses = obj.responses;
  return form;
};

export default VendorForm;
