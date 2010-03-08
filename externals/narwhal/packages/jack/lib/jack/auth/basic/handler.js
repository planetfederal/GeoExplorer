/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var base64 = require("base64"),
    update = require("hash").Hash.update,
    AbstractHandler = require('jack/auth/abstract/handler').Handler,
    AbstractRequest = require('jack/auth/abstract/request').Request;

/********************************************************
 * Request
 * inherits from AbstractRequest
 ********************************************************/

var Request = exports.Request = function(env) {
    AbstractRequest.call(this, env);
}

Request.prototype = update(Object.create(AbstractRequest.prototype), {
    
    isBasic: function() {
        return this.scheme.search(/^basic$/i) != -1;
    },

    decodeCredentials: function (str) {
        var decoded = base64.decode(str).match(/(\w+):(.*)/);
        this.username = decoded[1];
        this.password = decoded[2];
    }
});

/********************************************************
 * Handler
 * inherits from AbstractHandler
 ********************************************************/

var Handler = exports.Handler = function(params) {
    AbstractHandler.call(this, params);
}

Handler.prototype = update(Object.create(AbstractHandler.prototype), {
    
    // generate() returns a Basic Auth JSGI handler for the app
    generate: function(app) {
        var self = this;

        return function(env) {

            var request = new Request(env);

            if (!request.authorizationKey()) return self.Unauthorized();
            if (!request.isBasic()) return self.BadRequest;

            //isValid is provided by the middleware user
            if (!self.isValid(request)) return self.Unauthorized();
            
            env['REMOTE_USER'] = request.username;
            return app(env);
        }
    },

    issueChallenge: function() {
        return ('Basic realm=' + this.realm);
    }
});

/********************************************************
 *  Basic Auth Middleware
 ********************************************************/

exports.Middleware = function(app, params) {
    return new Handler(params).generate(app);
};