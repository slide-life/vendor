var Display = {
  autofillForm: function(form) {
    var blocks = Slide.extractBlocks(form);
    Slide.User.prompt(function (number, key) {
      (new Slide.Actor()).openRequest(blocks, number, key, function (fields) {
        Slide.populateFields(form, fields);
      });
    });
  }
};

export default Display;
