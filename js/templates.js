Handlebars.registerPartial("account", Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "You are logged in as <span class=\"name\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</span>\n";
},"useData":true}));

Handlebars.registerPartial("form-list", Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"form-list-item\" data-form="
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + ">\n  <div class=\"filter-controls\">\n    "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n  </div>\n  <div class=\"download-controls\">\n    <button class=\"control send-to-users\"><span class=\"glyphicon glyphicon-send\"></span> Send to users</button>\n    <button class=\"control view-responses\"><span class=\"glyphicon glyphicon glyphicon-inbox\"></span> View responses</button>\n  </div>\n</div>\n";
},"useData":true}));

Handlebars.registerPartial("forms-table", Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <td>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</td>\n";
},"3":function(depth0,helpers,partials,data,depths) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials['response-row'], '      ', 'response-row', depth0, {
    'fields': ((depths[1] != null ? depths[1].fields : depths[1])),
    'response': (depth0)
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<table class=\"data-table\" data-slide-table="
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + ">\n  <thead>\n    <tr>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.fields : depth0), {"name":"each","hash":{},"fn":this.program(1, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "    </tr>\n  </thead>\n  <tbody>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.responses : depth0), {"name":"each","hash":{},"fn":this.program(3, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </tbody>\n</table>\n";
},"usePartial":true,"useData":true,"useDepths":true}));

Handlebars.registerPartial("response-row", Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <td data-slide-identifier="
    + escapeExpression(((helper = (helper = helpers.identifier || (depth0 != null ? depth0.identifier : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"identifier","hash":{},"data":data}) : helper)))
    + ">"
    + escapeExpression(((helper = (helper = helpers.data || (depth0 != null ? depth0.data : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"data","hash":{},"data":data}) : helper)))
    + "</td>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "<tr>\n";
  stack1 = ((helpers.buildResponseRow || (depth0 && depth0.buildResponseRow) || helperMissing).call(depth0, (depth0 != null ? depth0.response : depth0), (depth0 != null ? depth0.fields : depth0), {"name":"buildResponseRow","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</tr>\n";
},"useData":true}));

Handlebars.registerPartial("users-table", Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <td>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</td>\n";
},"3":function(depth0,helpers,partials,data,depths) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials['response-row'], '      ', 'response-row', depth0, {
    'fields': ((depths[1] != null ? depths[1].fields : depths[1])),
    'response': (depth0)
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<table class=\"data-table\" data-slide-table="
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + ">\n  <thead>\n    <tr>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.fields : depth0), {"name":"each","hash":{},"fn":this.program(1, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "    </tr>\n  </thead>\n  <tbody>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.responses : depth0), {"name":"each","hash":{},"fn":this.program(3, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </tbody>\n</table>\n";
},"usePartial":true,"useData":true,"useDepths":true}));

this["SlideVendorTemplates"] = this["SlideVendorTemplates"] || {};

this["SlideVendorTemplates"]["form"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<div class=\"page-control\">\n  <div class=\"filter-controls\">\n    <button class=\"control\"><span class=\"icon icon-filter\"></span>Filter updates</button>\n  </div>\n  <div class=\"download-controls\">\n    <button class=\"control\"><span class=\"icon icon-download-updated\"></span>Download updated</button>\n    <button class=\"control\"><span class=\"icon icon-download\"></span>Download all</button>\n  </div>\n</div>\n";
  stack1 = this.invokePartial(partials['forms-table'], '', 'forms-table', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true});



this["SlideVendorTemplates"]["forms"] = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials['form-list'], '  ', 'form-list', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  return "  <div class=\"empty-wrapper\">\n    <div class=\"empty-inner-wrapper\">\n      <div class=\"empty-image empty-forms\"></div>\n      <div class=\"empty-label\">You have not created any forms yet.</div>\n    </div>\n  </div>\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<div class=\"page-control form-control\">\n  <div class=\"add-form\">\n    <h4 class=\"add-form-header\">Create new form</h4>\n    <div class=\"add-form-input-group\">\n      <label class=\"add-form-label\" for=\"add-form-name\">Name</label>\n      <input class=\"add-form-input\" id=\"add-form-name\">\n    </div>\n    <div class=\"add-form-input-group\">\n      <label class=\"add-form-label\" for=\"add-form-description\">Description</label>\n      <input class=\"add-form-input\" id=\"add-form-description\">\n    </div>\n    <div class=\"add-form-input-group\">\n      <label class=\"add-form-label\" for=\"add-form-fields\">Fields</label>\n      <input class=\"add-form-input\" id=\"add-form-fields\">\n    </div>\n    <div>\n      <button class=\"control add-form-submit\"><span class=\"glyphicon glyphicon-plus\"></span> Create form</button>\n    </div>\n  </div>\n  <div class=\"download-controls\">\n    <button class=\"control add-new-form\"><span class=\"glyphicon glyphicon-plus\"></span> Create new form</button>\n  </div>\n</div>\n";
  stack1 = helpers.each.call(depth0, depth0, {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true});



this["SlideVendorTemplates"]["users"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<div class=\"page-control\">\n  <div class=\"filter-controls\">\n    <button class=\"control\"><span class=\"icon icon-filter\"></span>Filter updates</button>\n  </div>\n  <div class=\"download-controls\">\n    <button class=\"control\"><span class=\"icon icon-download-updated\"></span>Download updated</button>\n    <button class=\"control\"><span class=\"icon icon-download\"></span>Download all</button>\n  </div>\n</div>\n";
  stack1 = this.invokePartial(partials['users-table'], '', 'users-table', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true});