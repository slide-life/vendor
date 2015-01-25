import Crypto from '../utils/crypto';

var Securable = function(pub, priv, key) {
  this.loadWithKeys(pub, priv, key);
};

Securable.prototype.loadWithKeys = function(pub, priv, key) {
  this.publicKey = pub;
  this.privateKey = priv;
  this.symmetricKey = key;
};

Securable.prototype.generate = function() {
  var self = this;
  var keys = Crypto.generateKeysSync();
  self.publicKey = keys.publicKey;
  self.privateKey = keys.privateKey;
  self.symmetricKey = Crypto.AES.generateKey();
};

Securable.prototype.prettyKey = function() {
  return Crypto.AES.prettyKey(this.encryptedSymmetricKey());
};

Securable.prototype.prettyPublicKey = function() {
  return this.publicKey;
};

Securable.prototype.encryptedSymmetricKey = function() {
  return Crypto.encrypt(this.symmetricKey, this.publicKey);
};

Securable.prototype.getChecksum = function() {
  return Crypto.encrypt('', this.publicKey);
};

Securable.prototype.prettyChecksum = function() {
  return this.checksum ? Crypto.prettyPayload(this.checksum) : this.checksum;
};

Securable.prototype.decrypt = function(data) {
  return Crypto.AES.decrypt(data, this.symmetricKey);
};

Securable.prototype.decryptData = function(data) {
  return Crypto.AES.decryptData(data, this.symmetricKey);
};

Securable.prototype.encrypt = function(data) {
  return Crypto.AES.encrypt(data, this.symmetricKey);
};

Securable.prototype.encryptData = function(data) {
  return Crypto.AES.encryptData(data, this.symmetricKey);
};

export default Securable;
