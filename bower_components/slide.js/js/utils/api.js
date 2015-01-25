var HOST = 'localhost:9292';

export default {
  endpoint: function(/* protocol, */ path) {
    if (arguments.length > 1) {
      return arguments[0] + HOST + arguments[1];
    } else {
      return 'http://' + HOST + path;
    }
  },

  enableJSON: function (options) {
    if (options.data) { options.data = JSON.stringify(options.data); }
    options.contentType = 'application/json; charset=utf-8';
    options.dataType = 'json';
  },

  get: function (path, options) {
    options.url = this.endpoint(path);
    options.type = 'GET';
    options.dataType = 'json';
    if (options.data) {
      for (var k in options.data) {
        options.data[k] = options.data[k].replace(/=/g, '*');
      }
    }
    $.ajax(options);
  },

  post: function (path, options) {
    options.url = this.endpoint(path);
    options.type = 'POST';
    this.enableJSON(options);
    $.ajax(options);
  },

  put: function (path, options) {
    options.url = this.endpoint(path);
    options.type = 'PUT';
    this.enableJSON(options);
    $.ajax(options);
  },

  patch: function (path, options) {
    options.url = this.endpoint(path);
    options.type = 'PATCH';
    this.enableJSON(options);
    $.ajax(options);
  },

  socket: function (path) {
    return new WebSocket(this.endpoint('ws://', path));
  }
};
