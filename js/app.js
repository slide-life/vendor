/* Handlebars helpers */

function performOnLeaves (k, struct, fn) {
  if (typeof struct != 'object') {
    return fn(k, struct);
  } else if (Array.isArray(struct)) {
    return struct.map(function (s, i) {
      return performOnLeaves(i, s, fn);
    });
  } else {
    var mapped = {};
    for (var k in struct) {
      mapped[k] = performOnLeaves(k, struct[k], fn);
    }
    return mapped;
  }
}

function getLeaves (struct) {
  var o = {};
  performOnLeaves('', struct, function (k, x) {
    o[k] = x;
  });
  return o;
}

function flattenSchema (s) {
  var fs = [];
  if (!(typeof s == 'object')) {
    return fs;
  }
  for (var k in s) {
    if (k[0] != '_') {
      var children = flattenSchema(s[k]);
      fs = fs.concat([k]).concat(children.map(function (child) {
        return [k, child].join('.');
      }));
    }
  }
  return fs;
}

function fetch (struct, path) {
  if (path.length == 1) return struct[0][path[0]];
  else return fetch(struct[path[0]], path.slice(1));
}

Handlebars.registerHelper('buildResponseRow', function(response, fields, options) {
  return fields.reduce(function (acc, field) {
    //var parts = field.identifier.split(':');
    //console.log('parts', parts);
    //var path = [parts[0]].concat(parts[1].split('.'));
    //console.log('path', path);
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

  SlideVendor.prototype.prompt = function (title, fields, cb) {
    var cls = "prompt" + new Date().getTime();
    var form = fields.map(function (field, n) {
      var $input = $('<input type="text" data-n="'+n+'" class="promptInput '+cls+'" name="'+field.n+'" value="">');
      return '<label class="field-label">'+field.n+'</label>' + $input[0].outerHTML + '<br />';
    }).join('\n');
    $.prompt({
      state0: {
        title: title,
        html: form,
        buttons: { Done: 1 },
        focus: "input:first-of-type",
        submit: function(e,v,m,f){ 
          cb(f);
          e.preventDefault();
          $.prompt.close();
        }
      }
    });
    fields.forEach(function (f, n) {
      if (f.xs) {
        var tokenized = $('.' + cls).filter('[data-n="'+n+'"]');
        tokenized.tokenInput(f.xs.map(function (x) {
          return {name: x};
        }), {
          theme: "facebook",
          tokenValue: "name"
        })
      }
    });
  };

  SlideVendor.prototype.runTestsAndMocks = function (cb) {
    cb();
  };

  SlideVendor.prototype.loadVendor = function (middleware, cb) {
    if (localStorage.vendor) {
      this.vendor = Slide.Vendor.fromObject(JSON.parse(localStorage.vendor));
      cb(this.vendor);
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
          next();
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
        Slide.Card.getFlattenedSchemasForFields(responses.fields, function (schemas) {
          self.render(target, {
            fields: self.transformFields(schemas),
            responses: responses.responses
          });
        });
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
        var leaves = responses.responses.map(getLeaves);
        var template = Handlebars.partials['forms-table']({
          fields: self.transformFields(schemas),
          responses: leaves
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

  SlideVendor.prototype.getFields = function (cb) {
    if (this._fields) {
      cb(this._fields);
    } else {
      Slide.Card.get('slide.life', {
        success: function (c) {
          console.log(c.schema);
          this._fields = flattenSchema(c.schema);
          cb(this._fields);
        }
      })
    }
  };

  SlideVendor.prototype.askForForm = function (cb) {
    var self = this;

    this.getFields(function (fs) {
      self.prompt('Create New Form',
        [{n:'name'}, {n:'description'}, {n:'fields', xs:fs}],
        function (form) {
          var name = form.name;
          var description = form.description;
          var fields = form.fields.split(',').map(function (field) {
            return field.trim();
          });
          cb(name, description, fields);
        });
    });
  };

  SlideVendor.prototype.askForUsers = function (cb) {
    var self = this;

    this.prompt('Enter Recipients', [{n:'numbers'}], function (f) {
      var numbers = f.numbers.split(',').map(function (number) {
        return number.trim();
      });
      cb(numbers);
    });
  };

  SlideVendor.prototype.promptForNewForm = function () { //TODO: rename function to something more appropriate
    var self = this;

    this.askForForm(function (name, description, fields) {
      self.createForm(name, description, fields, function (form) {
        form.form_fields = form.fields;
        self.data.forms.push(form);
        self.updatePage('forms');
      });
    });
  };

  SlideVendor.prototype.sendFormToUsers = function (form) {
    var self = this;

    this.askForUsers(function (numbers) {
      numbers.forEach(function (number) {
        Slide.User.getByIdentifier(new Slide.Identifier.Phone(number), {
          success: function (user) {
            self.vendor.loadRelationship(user, {
              success: function (relationship) {
                relationship.createConversation(form.name, {
                  success: function (conversation) {
                    conversation.request(user, form.fields, {
                      success: function () {
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    });
  };

  SlideVendor.prototype.initializeFormListeners = function () {
    var self = this;

    $(document).on('click', '.new-form', this.promptForNewForm.bind(this));

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
