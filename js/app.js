/* Handlebars helpers */

Handlebars.registerHelper('buildResponseRow', function(response, fields, options) {
  return fields.reduce(function (acc, field) {
    return acc + options.fn({ data: response[field.identifier], identifier: field.identifier });
  }, '');
});

/* App */

(function($) {
  var SlideVendor = function () {
    var self = this;

    /* Data */
    this.data = {};
    this.templates = SlideVendorTemplates;

    /* Views */
    this.$sidebar = $('.sidebar');
    this.$container = $('.container');
    this.$page = $('.container').find('.page');

    /* Vendor login */
    Slide.Vendor.load(function (next) {
      Slide.Vendor.invite('thecoop.com', function (vendor) {
        vendor.register(function (vendor) {
          vendor.persist();
          next(vendor);
        });
      });
    }, function (vendor) {
      self.vendor = vendor;
      vendor.getProfile(function(profile) {
        console.log(profile);
        self.loadResponses(profile._responses, function (responses) {
          console.log(responses);
        });
      });
      vendor.loadForms(function (forms) {
        self.data.forms = forms;
        self.$page.html(self.templates.forms(forms));
      });
    });

    self.initializeListeners();
  };

  SlideVendor.prototype.loadResponses = function(responses, cb) {
    var self = this;
    for( var uuid in responses ) {
      if( responses[uuid] ) {
        new Slide.VendorUser(uuid).load(function(user) {
          // var key = Slide.Crypto.decryptString(Slide.Crypto.uglyPayload(user.vendor_key),
          //  self.vendor.privateKey);
          var fields = Slide.Crypto.AES.decryptData(responses[uuid]._latest_profile, Slide.Crypto.uglyPayload("1vp2gWu3MKtho4ib2RjVijWQBCjoYqhi4CGQg4QkN5c="));
          cb(fields);
        });
      }
    }
  };

  SlideVendor.prototype.updatePage = function (target) {
    var data;

    if (target === 'users') {
      data = this.data.forms[0];
    } else if (target === 'forms') {
      data = this.data.forms;
    } else {
      throw new Error('Invalid target: must be either users or forms');
    }

    var content = this.templates[target](data);
    this.$page.html(content);
  };

  SlideVendor.prototype.addResponseToForm  = function (id, response) {
    var form;

    this.data.forms.forEach(function (f) {
      if (f.id === id) {
        form = f;
      }
    });

    if (!!form) {
      var $row = $(Handlebars.partials['response-row']({ response: response, fields: form.fields }));
      $row.hide();
      $('.data-table[data-slide-table=' + form.id + ']').find('tbody').prepend($row);
      $row.fadeIn(1000);
    }
  };

  SlideVendor.prototype.transformFields = function (fields) {
    var fs = [];
    $.each(fields, function (identifier, field) {
      fs.push({ identifier: identifier, description: field._description });
    });
    return fs;
  };

  SlideVendor.prototype.showResponsesForForm = function (form) {
    var self = this;
    this.getResponsesForForm(form, function (responses) {
      var identifiers = form.form_fields;
      Slide.Block.getFlattenedFieldsForIdentifiers(identifiers, function (fields) {
        var template = Handlebars.partials['data-table']({
          fields: self.transformFields(fields),
          responses: responses
        });
        self.$page.html(template);
      });
    });
  }

  SlideVendor.prototype.getResponsesForForm = function (form, cb) {
    Slide.VendorForm.get(this.vendor, form.id, function(form) {
      var responses = [];
      for (var uuid in form.responses) {
        if (form.responses[uuid]) {
          new Slide.VendorUser(uuid).load(function(user) {
            var key = Slide.crypto.decrypt(user.vendor_key,
              vendor.privateKey);
            var fields = Slide.crypto.AES.decryptData(form.responses[uuid], key);
            responses.push({ user: user, fields: fields });
          });
        }
      }
      cb(responses);
    });
  };

  SlideVendor.prototype.createForm = function (name, description, fields, cb) {
    this.vendor.createForm(name, description, fields, cb);
  };

  SlideVendor.prototype.getFormById = function (id) {
    var form;
    this.data.forms.forEach(function (f) {
      if (f.id === id) {
        form = f;
      }
    });
    return form;
  };

  SlideVendor.prototype.initializeListeners = function () {
    this.initializeSidebarListeners();
    this.initializeDataTableListeners();
    this.initializeFormListeners();
  };

  SlideVendor.prototype.initializeSidebarListeners = function () {
    var self = this;
    this.$container.find('.sidebar .link').on('click', function () {
      var target = $(this).data('target');
      $(this).siblings().removeClass('active');
      $(this).addClass('active');

      self.updatePage(target);
    });
  };

  SlideVendor.prototype.initializeDataTableListeners = function () {
    $(document).on('click', '.data-table tbody td', function () {
      $('.data-table tbody tr').removeClass('selected');
      $(this).parent().addClass('selected');
    });
  };

  SlideVendor.prototype.initializeFormListeners = function () {
    var self = this;

    $(document).on('click', '.new-form', function () {
      var representation = prompt('Input the fields for your forms').split('|');
      var name = representation[0];
      var description = representation[1];
      var fields = representation[2].split(',').map(function (field) {
        return field.trim();
      });

      self.createForm(name, description, fields, function (form) {
        console.log(form);
        var number = prompt('To whom?');
        var user = new Slide.User(number);
        user.get(function(user) {
          new Slide.Actor('thecoop.com').initialize(function(actor) {
            var downstream = {
              type: 'user', downstream: number, key: user.public_key
            };
            Slide.VendorUser.createRelationship({
              publicKey: user.public_key
            }, self.vendor, function(vendorUser) {
              console.log(vendorUser);
              actor.openRequest({
                form: form, vendorUser: vendorUser.uuid
              }, downstream, function(msg) {
                console.log(form);
              });
            });
          });
        });

      });
    });

    $(document).on('click', '.view-responses', function () {
      var form = self.getFormById($(this).parents('.data-table-control').data('form'));
      self.showResponsesForForm(form);
    });


    $(document).on('click', '.send-to-users', function () {
      var form = self.getFormById($(this).parents('.data-table-control').data('form'));
      var numbers = prompt('Input the comma separated list of numbers').split(',').map(function (number) {
        return number.trim();
      });

      numbers.forEach(function (number) {
        form.requestContentFromUser(number);
      });
    });
  };

  var app = new SlideVendor();
  window.app = app;
  app.updatePage(app.$sidebar.find('.link.active').data('target'));
})($);
