import API from '../utils/api';
import Crypto from '../utils/crypto';
import Conversation from './conversation';
import Securable from './securable';

var Actor = function() {
  var self = this;
  var keys = Crypto.generateKeysSync();
  self.publicKey = keys.publicKey;
  self.privateKey = keys.privateKey;
};

$.extend(Actor.prototype, Securable.prototype);

Actor.fromObject = function(obj) {
  var actor = new Actor();
  actor.privateKey = obj.privateKey;
  actor.publicKey = obj.publicKey;
  actor.name = obj.name;
  actor.id = obj.id;
  return actor;
};

Actor.prototype.openRequest = function(blocks, downstream, onMessage, onCreate) {
  this.openConversation(downstream, function(conversation) {
    onCreate && onCreate(conversation);
    conversation.request(blocks);
  }, onMessage);
};

Actor.prototype.register = function(cb) {
  var self = this;
  API.post('/actors', {
    data: { name: this.name, public_key: this.publicKey },
    success: cb
  });
};

Actor.prototype.initialize = function(cb) {
  var self = this;
  this.register(function(actor) {
    self.id = actor.id;
    cb && cb(self);
  });
};

Actor.prototype.openConversation = function(downstream, onCreate, onMessage) {
  var self = this;
  this.initialize(function(actor) {
    self.id = actor.id;
    self.listen(function(fields) {
      // TODO: Propogate UI updates
      onMessage(fields);
    });

    var conversation = new Conversation({
      upstream: self.id,
      type: 'actor'
    }, downstream, onCreate);
    self.symmetricKey = conversation.symmetricKey;
  });
};

Actor.prototype.getId = function() {
  return this.id;
};

Actor.prototype.getDevice = function() {
  return { type: 'actor', id: this.getId(), key: this.publicKey };
};

Actor.prototype.onmessage = function(message, cb) {
  if( message.verb === 'verb_request' ) {
    cb(message.payload.blocks, message.payload.conversation);
  } else {
    var data = message.payload.fields;
    cb(this.decryptData(data));
  }
};

Actor.prototype._listen = function(Socket, cb) {
  var socket = new Socket(API.endpoint('ws://', '/actors/' + this.id + '/listen'));
  var self = this;
  socket.onmessage = function (event) {
    var message = JSON.parse(event.data);
    self.onmessage(message, cb);
  };
};

Actor.prototype.listen = function(cb) {
  this._listen(WebSocket, cb);
};

export default Actor;
