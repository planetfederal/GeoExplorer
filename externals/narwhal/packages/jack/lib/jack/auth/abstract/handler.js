/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var update = require("hash").Hash.update,
    responseForStatus = require("jack/utils").responseForStatus;

var Handler = exports.Handler = function(params) {
    if (params) update(this, params);
};

Handler.prototype = {
    
    Unauthorized: function(challenge) {
        var response = responseForStatus(401);
        HashP.set(response.headers, "WWW-Authenticate", challenge || this.issueChallenge());
        return response;
    },

    BadRequest: responseForStatus(400),

    isValid: function() {
        throw "jack.auth.abstract.handler.isValid(): override required!";
    }
};