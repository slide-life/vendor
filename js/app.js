/* Handlebars helpers */

Handlebars.registerHelper('buildResponseRow', function(response, fields, options) {
  return fields.reduce(function (acc, field) {
    return acc + options.fn({ data: response[field.identifier], identifier: field.identifier });
  }, '');
});

/* App */

(function($) {
  var NAME = 'The COOP';
  var DOMAIN = 'thecoop.com';
  var SCHEMA = {
  };

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
      self.displayVendor();
      self.runTestsAndMocks(function () {
        self.updatePage(self.$sidebar.find('.link.active').data('target'));
      });
    });
    this.initializeListeners();
  };

  SlideVendor.prototype.runTestsAndMocks = function (cb) {
    cb();
  };

  SlideVendor.prototype.loadVendor = function (middleware, cb) {
    if (localStorage.vendor) {
      cb(Slide.Vendor.fromObject(JSON.parse(localStorage.vendor)));
    } else {
      middleware(cb);
    }
  };

  SlideVendor.prototype.loginOrRegister = function (cb) { //will be replaced in final
    var self = this;

    this.loadVendor(function (next) {
      Slide.Vendor.create(NAME, DOMAIN, SCHEMA, {
        success: function (vendor) {
          self.vendor = vendor;
          self.persistVendor(self.vendor);
          cb();
        }
      });
    }, cb);
  };

  SlideVendor.prototype.persistVendor = function (vendor) {
    localStorage.vendor = JSON.stringify(vendor.toObject());
  };

  SlideVendor.prototype.displayVendor = function () {
    this.$header.find('.user').html(Handlebars.partials.account(this.vendor));
  };

  //tab controller
  SlideVendor.prototype.updatePage = function (target) {
    var self = this;
    if (target === 'users') {
      this.displayUsers(target);
    } else if (target === 'forms') {
      this.displayForms(target);
    } else {
      throw new Error('Invalid target: must be either users or forms');
    }
  };

  SlideVendor.prototype.render = function (target, data) {
    this.$page.html(this.templates[target](data));
  };

  //tab views start here
  SlideVendor.prototype.displayUsers = function (target, cb) {
    var self = this;
    this.vendor.getAllResponses({
      success: function (responses) {
        self.render(target, responses);
      }
    });
  };

  SlideVendor.prototype.displayForms = function (target, cb) {
    var self = this;

    this.vendor.getForms({
      success: function (forms) {
        self.data.forms = forms;
        self.render(target, forms);
      }
    });
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
      var fields = form.fields;
      Slide.Card.getFlattenedSchemasForFields(fields, function (schemas) {
        var template = Handlebars.partials['forms-table']({
          fields: self.transformFields(schemas),
          responses: responses
        });
        self.$page.html(template);
      });
    });
  };

  SlideVendor.prototype.getResponsesForForm = function (form, cb) {
    var self = this;
    this.vendor.getResponsesForForm(form, { success: cb });
  };

  SlideVendor.prototype.createForm = function (name, description, fields, cb) {
    this.vendor.createForm(name, description, fields, { success: cb });
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

  SlideVendor.prototype.promptForNewForm = function () {
    var self = this;

    var representation = prompt('Input the fields for your forms').split('|');
    var name = representation[0];
    var description = representation[1];
    var fields = representation[2].split(',').map(function (field) {
      return field.trim();
    });

    this.createForm(name, description, fields, function (form) {
      form.form_fields = form.fields;
      self.data.forms.push(form);
      self.updatePage('forms');
    });
  };

  SlideVendor.prototype.sendFormToUsers = function (form) {
    var self = this;

    var numbers = prompt('Input the comma separated list of numbers').split(',').map(function (number) {
      return number.trim();
    });

    numbers.forEach(function (number) {
      Slide.User.getByIdentifier(new Slide.Identifier.Phone(number), {
        success: function (user) {
          self.vendor.createRelationship(user, {
            success: function (relationship) {
              relationship.createConversation(form.name, {
                success: function (conversation) {
                  conversation.request(user, form.fields, {
                    success: function () {
                      console.log('requested from user', user);
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  };

  SlideVendor.prototype.initializeFormListeners = function () {
    var self = this;

    $(document).on('click', '.new-form', this.promptForNewForm);

    $(document).on('click', '.view-responses', function () {
      var form = self.getFormById($(this).parents('.form-list-item').data('form'));
      self.showResponsesForForm(form);
    });

    $(document).on('click', '.send-to-users', function () {
      var form = self.getFormById($(this).parents('.form-list-item').data('form'));
      self.sendFormToUsers(form);
    });
  };

  var app = new SlideVendor();
  window.app = app;
})($);
