/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var base64 = require("base64"),
    trim = require("util").trim,
    update = require("hash").Hash.update,
    Handler = require('jack/auth/digest/handler');

// params include
//
// digest, optional:
// timestamp, optional:
// privateKey needs to set to a constant string
// timeLimit, optional integer (number of milliseconds) to limit the validity of the generated nonces.

var decode = exports.decode = function(str) {
    var parts = base64.decode(str).match(/(\d+) (.*)/);
    
    return new Nonce({
        timestamp: parseInt(parts[1]),
        digest: parts.pop()
    });
};


var Nonce = exports.Nonce = function(params) {
    if (params) update(this, params);

    //defaults
    if (!this.timestamp) this.timestamp = new Date().getTime();   //milliseconds since 1970
}

Nonce.prototype = {

    isValid: function() {
        return this.digest == this.toDigest();
    },

    toString: function() {
        return trim(base64.encode([this.timestamp, this.toDigest()].join(' ')));
    },

    toDigest: function() {
        return Handler.base16md5([this.timestamp, this.privateKey].join(':'));
    },

    isFresh: function() {
        if (!this.timeLimit) return true; // no time limit
        return (new Date().getTime() - this.timestamp < this.timeLimit);
    }
};