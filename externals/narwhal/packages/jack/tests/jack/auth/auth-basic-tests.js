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
    Basic = require("jack/auth/basic/handler");

var myRealm = 'WallysWorld';
var myAuth = function(credentials) {
    return ('Boss' == credentials.username);
}

var openApp = function(env) {
    return {
        status: 200,
        headers: {'Content-Type': 'text/plain'},
        body: ["Hi " + env['REMOTE_USER']]
    };
}

var basicApp = Basic.Middleware(openApp, {
    realm: myRealm,
    isValid: myAuth
});

var doRequest = function(request, headers) {
    if (headers === undefined) headers = {};
    return request.GET('/', headers);
}

var doRequestWithBasicAuth = function(request, username, password) {
  return doRequest(request, {'HTTP_AUTHORIZATION': 'Basic ' + base64.encode([username, password].join(':'))});
}

var doRequestWithCustomAuth = function(request, username, password) {
  return doRequest(request, {'HTTP_AUTHORIZATION': 'Custom ' + base64.encode([username, password].join(':'))});
}

function assertBasicAuthChallenge(response) {
    assert.eq(401,                  response.status);
    assert.eq('text/plain',         response.headers['Content-Type']);
    assert.isTrue(response.headers['WWW-Authenticate'].search(/^Basic/) != -1);
    assert.eq('Basic realm='+myRealm, response.headers['WWW-Authenticate']);
}

/********************************************************
 * test BasicRequest
 ********************************************************/

exports.testBasicRequest = function() {
    var username = 'username', password = 'password';
    var env = MockRequest.envFor(null, "/", {'HTTP_AUTHORIZATION': 'Basic ' + base64.encode([username, password].join(':'))});
    var req = new Basic.Request(env);

    assert.isTrue(req.isBasic());
    assert.eq(username, req.username);
    assert.eq(password, req.password);
}

/********************************************************
 * test BasicHandler
 ********************************************************/

exports.testBasicHandlerValidCredentials = function() {
    var handler = new Basic.Handler({
        realm: myRealm,
        isValid: myAuth
    });

    //test handler.issueChallenge
    assert.eq('Basic realm='+myRealm, handler.issueChallenge());

    //test handler.isValid == true
    var base64Credentials = base64.encode(['Boss', 'password'].join(':'));
    var env = MockRequest.envFor(null, "/", {'HTTP_AUTHORIZATION': 'Basic ' + base64Credentials});
    var req = new Basic.Request(env);

    assert.isTrue(handler.isValid(req));
}

exports.testBasicHandlerInvalidCredentials = function() {
    var handler = new Basic.Handler({
        realm: myRealm,
        isValid: myAuth
    });
    
    //test handler.isValid == false
    var base64Credentials = base64.encode(['username', 'password'].join(':'));
    var env = MockRequest.envFor(null, "/", {'HTTP_AUTHORIZATION': 'Basic ' + base64Credentials});
    var req = new Basic.Request(env);

    assert.isFalse(handler.isValid(req));
}

/********************************************************
 * test Basic Auth as Jack middleware
 ********************************************************/

// should challenge correctly when no credentials are specified
exports.testChallengeWhenNoCredentials = function() {
    var request = new MockRequest(basicApp);
    assertBasicAuthChallenge(doRequest(request));
}

// should challenge correctly when incorrect credentials are specified
exports.testChallengeWhenIncorrectCredentials = function() {
    var request = new MockRequest(basicApp);
    assertBasicAuthChallenge(doRequestWithBasicAuth(request, 'joe', 'password'));
}

// should return application output if correct credentials are specified
exports.testAcceptCorrectCredentials = function() {
    var request = new MockRequest(basicApp);
    var response = doRequestWithBasicAuth(request, 'Boss', 'password');

    assert.eq(200, response.status);
    assert.eq('Hi Boss', response.body);
}

// should return 400 Bad Request if different auth scheme used
exports.testBadRequestIfSchemeNotBasic = function() {
    var request = new MockRequest(basicApp);
    var response = doRequestWithCustomAuth(request, 'Boss', 'password');

    assert.eq(400,       response.status);
    assert.eq(undefined, response.headers['WWW-Authenticate']);
}