/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

HashP = require("hashp").HashP;

var AUTHORIZATION_KEYS = ['HTTP_AUTHORIZATION', 'X-HTTP_AUTHORIZATION', 'X_HTTP_AUTHORIZATION'];

var Request = exports.Request = function(env) {
    this.env = env;

    if (!this.authorizationKey()) return;

    var parts = HashP.get(env, this._authorizationKey).match(/(\w+) (.*)/);

    this.scheme =  parts[1];
    this.decodeCredentials(parts.pop());
};

Request.prototype = {

    authorizationKey: function() {
        if (this._authorizationKey) return this._authorizationKey;

        for (var i=0; i < AUTHORIZATION_KEYS.length; i++) {
            var key = AUTHORIZATION_KEYS[i];
            if (HashP.includes(this.env, key)) return this._authorizationKey = key;
        }
    },

    decodeCredentials: function() {
        throw "jack.auth.abstract.request.decodeCredentials(): override required!";
    }
};