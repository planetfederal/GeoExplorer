/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var assert = require("test/assert"),
    base64 = require("base64"),
    MockRequest = require("jack/mock").MockRequest,
    AbstractHandler = require("jack/auth/abstract/handler").Handler,
    AbstractRequest = require("jack/auth/abstract/request").Request;

/*
 * tests for AbstractHandler
 */

exports.testUnauthorizedDefaultChallenge = function() {
    var testRealm = "testRealm";
    var handler = new AbstractHandler({realm:testRealm});

    handler.issueChallenge = function() {
        return ('Basic realm=' + this.realm);
    };

    var resp = handler.Unauthorized();

    assert.eq(401, resp.status);
    assert.eq('text/plain', resp.headers['Content-Type']);
    assert.eq('Basic realm='+testRealm, resp.headers['WWW-Authenticate']);

};

exports.testUnauthorizedCustomChallenge = function() {
    var testRealm = "testRealm";
    var handler = new AbstractHandler({realm:testRealm});

    var realm = "Custom realm="+testRealm;
    var resp = handler.Unauthorized(realm);

    assert.eq(401, resp.status);
    assert.eq('text/plain', resp.headers['Content-Type']);
    assert.eq(realm, resp.headers['WWW-Authenticate']);
};