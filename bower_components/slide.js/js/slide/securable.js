var Securable = function(pub, priv, key) {
  this.loadWithKeys(pub, priv, key);
};

Securable.prototype.loadWithKeys = function(pub, priv, key) {
  this.publicKey = pub;
  this.privateKey = priv;
  this.symmetricKey = key;
};

Securable.prototype.generate = function() {
  Slide.crypto.generateKeys(function(k) {
    this.publicKey = k.publicKey;
    this.privateKey = k.privateKey;
    this.symmetricKey = Slide.crypto.AES.generateKey();
  });
};

Securable.prototype.encryptedSymKey = function() {
  return Slide.crypto.encryptStringWithPackedKey(this.symmetricKey, this.publicKey);
};

Securable.prototype.checksum = function() {
  return Slide.crypto.encryptStringWithPackedKey('', this.symmetricKey);
};

Securable.prototype.decrypt = function(data) {
  return Slide.crypto.AES.decryptData(data, this.symmetricKey);
};

Securable.prototype.encrypt = function(data) {
  return Slide.crypto.AES.encryptData(data, this.symmetricKey);
};
