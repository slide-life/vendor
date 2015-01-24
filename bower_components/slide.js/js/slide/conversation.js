import api from './api';

var Conversation = function(upstream, downstream, cb, sym) {
  var key = sym || Slide.crypto.AES.generateKey();
  var obj = {
    symmetricKey: key,
    key: Slide.crypto.encryptStringWithPackedKey(key, downstream.key),
    upstream_type: upstream.type,
    downstream_type: downstream.type
  };
  var device = downstream.type === 'user' ? 'downstream_number' : 'downstream_id';
  var upDevice = upstream.type === 'user' ? 'upstream_number' : 'upstream_id';
  obj[device] = downstream.downstream;
  obj[upDevice] = upstream.upstream;
  Conversation.FromObject.call(this, obj, cb.bind(this));
};

Conversation.FromObject = function(obj, cb) {
  this.symmetricKey = obj.symmetricKey;
  var self = this;
  var downstream_pack = obj.downstream_type.toLowerCase() === 'user' ? {
    type: obj.downstream_type.toLowerCase(), number: obj.downstream_number
  } : {
    type: obj.downstream_type.toLowerCase(), id: obj.downstream_id
  };
  var upstream_pack = obj.upstream_type.toLowerCase() === 'user' ? {
    type: obj.upstream_type.toLowerCase(), number: obj.upstream_number
  } : {
    type: obj.upstream_type.toLowerCase(), id: obj.upstream_id
  };

  var payload = {
    key: obj.key,
    upstream: upstream_pack,
    downstream: downstream_pack
  };

  api.post('/conversations', {
    data: payload,
    success: function (conversation) {
      self.id = conversation.id;
      cb(self);
    }
  });
};

Conversation.FromObject.prototype = Conversation.prototype;

Conversation.prototype.request = function(blocks, cb) {
  api.post('/conversations/' + this.id + '/request_content', {
    data: { blocks: blocks },
    success: cb
  });
};

Conversation.prototype.deposit = function (fields) {
  api.post('/conversations/' + this.id + '/deposit_content', {
    data: { fields: Slide.crypto.AES.encryptData(fields, this.symmetricKey) }
  });
};

Conversation.prototype.respond = function(fields) {
  api.put('/conversations/' + this.id, {
    data: { fields: Slide.crypto.AES.encryptData(fields, this.symmetricKey) }
  });
};

Conversation.prototype.submit = function(uuid, fields) {
  var enc = Slide.crypto.AES.encryptData(fields, this.symmetricKey);
  var payload = {};
  payload[uuid] = enc;
  api.put('/conversations/' + this.id, {
    data: { fields: payload, patch: payload }
  });
};

export default Conversation;
