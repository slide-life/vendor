/* Fixtures */

var FIXTURE_FORMS = [
  {
    name: 'Coop form',
    id: '1232312',
    fields: [
      { description: 'First name', identifier: 'slide.life:name.first' },
      { description: 'Last name', identifier: 'slide.life:name.last' },
      { description: 'Title', identifier: 'slide.life:name.title' },
      { description: 'Phone number', identifier: 'slide.life:mobile-phone.number' },
      { description: 'Phone country code', identifier: 'slide.life:mobile-phone.country-code' },
      { description: 'Address', identifier: 'slide.life:address.first-line' }
    ],
    responses: [
      {
        'slide.life:name.first': 'Jack',
        'slide.life:name.last': 'Dent',
        'slide.life:name.title': 'Mr.',
        'slide.life:mobile-phone.number': '8572344988',
        'slide.life:mobile-phone.country-code': '1',
        'slide.life:address.first-line': '1318 Harvard Yard Mail Center'
      }
    ]
  }
];

/* Handlebars helpers */

Handlebars.registerHelper('buildResponseRow', function(response, fields, options) {
  return fields.reduce(function (acc, field) {
    return acc + options.fn({ data: response[field.identifier], identifier: field.identifier });
  }, '');
});

/* App */

(function($) {
  var SlideVendor = function () {
    this.data = { forms: FIXTURE_FORMS };
    this.$container = $('.container');
    this.$page = $('.container').find('.page');
    this.templates = SlideVendorTemplates;

    this.initializeListeners();
    this.updatePage('users-table');
  };

  SlideVendor.prototype.updatePage = function (target) {
    var content = this.templates[target](this.data.forms[0]);
    this.$page.html(content);
  };

  SlideVendor.prototype.addResponseForForm  = function (id, response) {
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

  SlideVendor.prototype.initializeListeners = function () {
    this.initializeSidebarListeners();
    this.initializDataTableListeners();
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

  SlideVendor.prototype.initializDataTableListeners = function () {
    $(document).on('click', '.data-table tbody td', function () {
      $('.data-table tbody tr').removeClass('selected');
      $(this).parent().addClass('selected');
    });
  };

  var app = new SlideVendor();
  setTimeout(function () {
    var form = app.data.forms[0].id;
    var response = {
      'slide.life:name.first': 'Michael',
      'slide.life:name.last': 'Gao',
      'slide.life:name.title': 'Mr.',
      'slide.life:mobile-phone.number': '75214213',
      'slide.life:mobile-phone.country-code': '1',
      'slide.life:address.first-line': '1232 Harvard Yard Mail Center'
    };
    app.addResponseForForm(form, response);
  }, 2000);
})($);
