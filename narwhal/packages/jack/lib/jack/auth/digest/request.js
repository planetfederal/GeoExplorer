/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var update = require("hash").Hash.update,
    AbstractRequest = require('jack/auth/abstract/request').Request,
    DigestParams = require('jack/auth/digest/params'),
    DigestNonce = require('jack/auth/digest/nonce');

var Request = exports.Request = function(env) {
    AbstractRequest.call(this, env);

    this.method = this.env['REQUEST_METHOD'];
}

Request.prototype = update(Object.create(AbstractRequest.prototype), {

    isDigest: function() {
        return this.scheme.search(/^digest$/i) != -1;
    },

    isCorrectUri: function() {
        return (this.env['SCRIPT_NAME'] + this.env['PATH_INFO'] == this.uri);
    },

    decodeNonce: function() {
        return this._decodedNonce || (this._decodedNonce = DigestNonce.decode(this.nonce));
    },

    decodeCredentials: function (str) {
        DigestParams.parse(this, str);
    }

});