var Crypto = {
  generateKeys: function (cb) {
    // This is a synchronous function, designed with a callback for the future.
    cb(forge.pki.rsa.generateKeyPair({ bits: 512, e: 0x10001 }));
  },

  generateKeysSync: function() {
    var keys;
    this.generateKeys(function(k) {
      keys = k;
    });
    return this.packKeys(keys);
  },

  packPublicKey: function (key) {
    return btoa(forge.pki.publicKeyToPem(key));
  },
  packPrivateKey: function (key) {
    return btoa(forge.pki.privateKeyToPem(key));
  },

  packKeys: function (keys) {
    return {
      publicKey: this.packPublicKey(keys.publicKey),
      privateKey: this.packPrivateKey(keys.privateKey)
    };
  },

  AES: {
    generateCipher: function() {
      return {
        key: forge.random.getBytesSync(16),
        iv: forge.random.getBytesSync(16)
      };
    },

    _packCipher: function(cipher) {
      // TODO: NB! this and _unpack used to use btoa, atob
      return cipher.key+cipher.iv;
    },

    _unpackCipher: function(packed) {
      var decoded = packed,
          key = decoded.substr(0, 16),
          iv = decoded.substr(16);
      return {key:key,iv:iv};
    },

    generateKey: function() {
      return this._packCipher(this.generateCipher());
    },

    encrypt: function(payload, seed) {
      var unpacked = this._unpackCipher(seed),
          key = unpacked.key,
          iv = unpacked.iv;
      var cipher = forge.cipher.createCipher('AES-CBC', key);
      cipher.start({iv: iv});
      cipher.update(forge.util.createBuffer(payload));
      cipher.finish();
      return cipher.output.toHex();
    },

    decrypt: function(hex, seed) {
      var unpacked = this._unpackCipher(seed),
          key = unpacked.key,
          iv = unpacked.iv;
      var decipher = forge.cipher.createDecipher('AES-CBC', key);
      decipher.start({iv: iv});
      var payload = new forge.util.ByteStringBuffer(forge.util.hexToBytes(hex));
      decipher.update(payload);
      decipher.finish();
      return decipher.output.data;
    },

    decryptData: function(data, key) {
      var clean = {};
      for( var k in data ) {
        clean[k] = this.decrypt(atob(data[k]), key);
      }
      return clean;
    },

    encryptData: function(data, key) {
      var encrypted = {};
      for( var k in data ) {
        encrypted[k] = btoa(this.encrypt(data[k], key));
      }
      return encrypted;
    },

    encryptKey: function (key, pub) {
      // ascii-AES -> b64-RSA -> b64-RSA(AES)
      return Crypto.encrypt(key, pub);
    },
    decryptKey: function (key, priv) {
      // b64-RSA(AES) -> b64-RSA -> ascii-AES
      return Crypto.decrypt(key, priv);
    },

    prettyKey: function(key) {
      return Crypto.prettyPayload(key);
    },
    uglyKey: function(key) {
      return Crypto.uglyPayload(key);
    }
  },

  decryptString: function (text, sec) {
    return sec.decrypt(text);
  },

  decryptData: function (data, sec) {
    var clean = {};
    for( var key in data ) {
      clean[key] = this.decryptString(atob(data[key]), sec);
    }
    return clean;
  },

  encryptString: function (text, pub) {
    return pub.encrypt(text);
  },

  encryptDataWithKey: function (data, pub) {
    var encrypted = {};
    for( var key in data ) {
      encrypted[key] = btoa(this.encryptString(data[key], pub));
    }
    return encrypted;
  },

  encryptData: function (data, pem) {
    var pub = forge.pki.publicKeyFromPem(pem);
    return this.encryptDataWithKey(data, pub);
  },

  encrypt: function (text, key) {
    var pub = forge.pki.publicKeyFromPem(atob(key));
    return pub.encrypt(text);
  },

  decrypt: function (text, key) {
    var pub = forge.pki.privateKeyFromPem(atob(key));
    return pub.decrypt(text);
  },
  prettyPayload: function(payload) {
    if( typeof payload !== 'string' ) {
      throw new Error('First argument expected to be "string"');
    }
    if( payload.match(/=$/) ) {
      console.warn('You may have provided a base64 encoded payload.');
    }
    return btoa(payload);
  },
  uglyPayload: function(payload) {
    if( typeof payload !== 'string' ) {
      throw new Error('First argument expected to be "string"');
    }
    if( !payload.match(/^[A-Za-z=0-9+\/]+$/) ) {
      throw new Error('Payload is not in base64 encoding.');
    }
    return atob(payload);
  }
};

export default Crypto;
