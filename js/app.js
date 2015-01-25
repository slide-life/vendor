/* Handlebars helpers */

Handlebars.registerHelper('buildResponseRow', function(response, fields, options) {
  return fields.reduce(function (acc, field) {
    return acc + options.fn({ data: response[field.identifier], identifier: field.identifier });
  }, '');
});

/* App */

(function($) {
  var ORGANISATION = 'The COOP';

  var SlideVendor = function () {
    var self = this;

    /* Data */
    this.data = {};
    this.templates = SlideVendorTemplates;

    /* Views */
    this.$header = $('.header');
    this.$sidebar = $('.sidebar');
    this.$container = $('.container');
    this.$page = $('.container').find('.page');

    /* Vendor login */
    this.loginOrRegister(function () {
      self.updatePage(self.$sidebar.find('.link.active').data('target'));
    });
    this.initializeListeners();
  };


  SlideVendor.prototype.loginOrRegister = function (cb) {
    var self = this;
    Slide.Vendor.load(function (next) {
      Slide.Vendor.invite(ORGANISATION, function (vendor) {
        vendor.register(function (vendor) {
          vendor.persist();
          next(vendor);
        });
      });
    }, function (vendor) {
      self.vendor = vendor;
      self.$header.find('.user').html(Handlebars.partials.account(vendor));
      cb();
    });
  };

  SlideVendor.prototype.updatePage = function (target) {
    var self = this;
    if (target === 'users') {
      this.getUsers(function (users) {
        self.data.users = users;
        self.$page.html(self.templates[target](users));
      });
    } else if (target === 'forms') {
      this.vendor.loadForms(function (forms) {
        self.data.forms = forms;
        self.$page.html(self.templates[target](forms));
      });
    } else {
      throw new Error('Invalid target: must be either users or forms');
    }
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

  SlideVendor.prototype.getUsers = function (cb) {
    // self.vendor.getProfile(function(profile) {
    //   self.loadResponses(profile._responses, function (responses) {
    //     console.log(profile);
    //     console.log(responses);
    //   });
    // });
    // var self = this;
    // for (var uuid in responses) {
    //   if (responses[uuid]) {
    //     new Slide.VendorUser(uuid).load(function(user) {
    //       // var key = Slide.Crypto.decryptString(Slide.Crypto.uglyPayload(user.vendor_key),
    //       //  self.vendor.privateKey);
    //       var fields = Slide.Crypto.AES.decryptData(responses[uuid]._latest_profile, Slide.Crypto.uglyPayload("1vp2gWu3MKtho4ib2RjVijWQBCjoYqhi4CGQg4QkN5c="));
    //       cb(fields);
    //     });
    //   }
    // }
    this.vendor.getUsers(function (users) {
      cb(users);
    });
  };

  SlideVendor.prototype.showResponsesForForm = function (form) {
    var self = this;
    this.getResponsesForForm(form, function (responses) {
      var identifiers = form.form_fields;
      Slide.Block.getFlattenedFieldsForIdentifiers(identifiers, function (fields) {
        var template = Handlebars.partials['forms-table']({
          fields: self.transformFields(fields),
          responses: responses
        });
        self.$page.html(template);
      });
    });
  }

  SlideVendor.prototype.getResponsesForForm = function (form, cb) {
    var self = this;
    Slide.VendorForm.get(this.vendor, form.id, function(form) {
      var responses = [];

      if (Object.keys(form.responses).length === 0) {
        cb([]);
      } else {
        for (var uuid in form.responses) {
          if (form.responses[uuid]) {
            new Slide.VendorUser(uuid).load(function(user) {
              var key = Slide.Crypto.uglyPayload("1vp2gWu3MKtho4ib2RjVijWQBCjoYqhi4CGQg4QkN5c=");
              var fields = Slide.Crypto.AES.decryptData(form.responses[uuid], key);
              var clean = {};
              for( var k in fields ) {
                clean[k.replace(/\//g, '.')] = fields[k];
              }
              responses.push(clean);
              if (responses.length === Object.keys(form.responses).length) {
                console.log(responses);
                cb(responses);
              }
            });
          }
        }
      }
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
        form.form_fields = form.fields;
        self.data.forms.push(form);
        self.updatePage('forms');
      });
    });

    $(document).on('click', '.view-responses', function () {
      var form = self.getFormById($(this).parents('.form-list-item').data('form'));
      self.showResponsesForForm(form);
    });


    $(document).on('click', '.send-to-users', function () {
      var form = self.getFormById($(this).parents('.form-list-item').data('form'));
      var numbers = prompt('Input the comma separated list of numbers').split(',').map(function (number) {
        return number.trim();
      });

      numbers.forEach(function (number) {
        var user = new Slide.User(number);
        user.get(function(user) {
          new Slide.Actor(ORGANISATION).initialize(function(actor) {
            var downstream = {
              type: 'user', downstream: number, key: user.public_key
            };
            Slide.VendorUser.createRelationship({
              publicKey: user.public_key,
              number: user.number
            }, self.vendor, function (vendorUser) {
              actor.openRequest({
                form: form, vendorUser: vendorUser.uuid
              }, downstream, function (msg) {
              });
            });
          });
        });
      });
    });
  };

  var app = new SlideVendor();
  window.app = app;
})($);
