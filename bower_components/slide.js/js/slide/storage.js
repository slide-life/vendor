import api from './api';

var cbs = {};
var isReady = false;
var queue = [];

window.addEventListener("message", function(evt) {
  var data = evt.message || evt.data;
  if(data.status) {
    isReady = true;
    queue.forEach(process);
    return;
  }
  cbs[data.channel](data.value);
  delete cbs[data.channel];
}, false);

var runner = $("<iframe>", {
  src: 'bower_components/slide.js/dist/views/auth.html'
});

$("body").append(runner);
runner.hide();
var process = function(msg) {
  runner[0].contentWindow.postMessage(msg, "*");
};

var Storage = {
  accessor: function(payload) {
    if( isReady )
      process(payload);
    else
      queue.push(payload);
  },
  persist: function(key, value) {
    this.accessor({
      verb: "set",
      key: key,
      value: value
    });
  },
  access: function(key, cb) {
    var channel = Math.floor(Math.random() * 10000);
    cbs[channel] = cb;
    this.accessor({
      verb: "get",
      key: key,
      channel: channel
    });
  }
};

export default Storage;

