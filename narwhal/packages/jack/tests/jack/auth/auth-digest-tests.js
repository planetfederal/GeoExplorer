/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var assert = require("test/assert"),
    Hash = require("hash").Hash,
    HashP = require("hashp").HashP,
    Jack = require("jack"),
    MockRequest = require("jack/mock").MockRequest,
    DigestNonce = require("jack/auth/digest/nonce"),
    DigestHandler = require("jack/auth/digest/handler"),
    DigestRequest = require("jack/auth/digest/request").DigestRequest,
    DigestParams = require("jack/auth/digest/params");

var myRealm = "WallysWorld";

/**********************************
 * apps
 *********************************/

var openApp = function(env) {
    return {
        status: 200,
        headers: {'Content-Type': 'text/plain'},
        body: ["Hi " + env['REMOTE_USER']]
    };
}

var digestApp = DigestHandler.Middleware(openApp, {
    realm: myRealm,
    opaque: "this-should-be-secret",
    getPassword: function(username) {
        return {'Alice': 'correct-password'}[username];
    }
});

var partiallyProtectedApp = Jack.URLMap({
    '/': openApp,
    '/protected': digestApp
});
        
/**********************************
 * helpers
 *********************************/

var doRequest = function(request, method, path, headers) {
    return request[method](path, headers || {});
}


var doRequestWithDigestAuth = function(request, method, path, username, password, options) {
    if (!options) options = {};

    var headers = {};

    if (options.input) {
        headers.input = options.input;
        delete options.input;
    }

    var response = doRequest(request, method, path, headers);
    if (response.status != 401) return response;

    if (options.wait) {
        var sleep = require('os-engine').sleep;  //sleep() is exported by the rhino engine
        if (sleep) sleep(options.wait);
        delete options.wait;
    }

    var challenge = HashP.get(response.headers, 'WWW-Authenticate').match(/digest (.*)/i).pop();

    var params = DigestParams.parse({
        username:   username,
        nc:         '00000001',
        cnonce:     'nonsensenonce',
        uri:        path,
        method:     method
    }, challenge);

    Hash.update(params, options);

    params.response =  DigestHandler.digest(params, password);
    HashP.set(headers, 'HTTP_AUTHORIZATION', "Digest "+DigestParams.toString(params));

    return doRequest(request, method, path, headers);
}

/********************************************************
 * assertions
 ********************************************************/

var assertDigestAuthChallenge = function(response){
    assert.eq(401,                  response.status);
    assert.eq('text/plain',         response.headers['Content-Type']);
    assert.isFalse(response.headers['WWW-Authenticate'] === undefined);
    assert.isTrue(response.headers['WWW-Authenticate'].search(/^Digest/) != -1);
}

var assertBadRequest = function(response) {
    assert.eq(400,                  response.status);
    assert.isTrue(response.headers['WWW-Authenticate'] === undefined);
}

/********************************************************
 * test Basic Auth as Jack middleware
 ********************************************************/

// should return application output for GET when correct credentials given
exports.testAcceptGetWithCorrectCredentials = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/', 'Alice', 'correct-password');

    assert.eq(200,                  response.status);
    assert.eq("Hi Alice",           response.body.toString());
};

// should return application output for POST when correct credentials given
exports.testAcceptPostWithCorrectCredentials = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'POST', '/', 'Alice', 'correct-password');

    assert.eq(200,                  response.status);
    assert.eq("Hi Alice",           response.body.toString());
};

// should return application output for PUT when correct credentials given
exports.testAcceptPutWithCorrectCredentials = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'PUT', '/', 'Alice', 'correct-password');

    assert.eq(200,                  response.status);
    assert.eq("Hi Alice",           response.body.toString());
};

// should challenge when no credentials are specified
exports.testChallengeWhenNoCredentials = function() {
    var request = new MockRequest(digestApp);
    var response = doRequest(request, 'GET', '/');
    assertDigestAuthChallenge(response);
};

// should challenge if incorrect username given
exports.testChallengeWhenIncorrectUsername = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/', 'Fred', 'correct-password');
    assertDigestAuthChallenge(response);
};

// should challenge if incorrect password given
exports.testChallengeWhenIncorrectPassword = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/', 'Alice', 'incorrect-password');
    assertDigestAuthChallenge(response);
};

// should return 400 Bad Request if incorrect scheme given
exports.testReturnBadRequestWhenIncorrectScheme = function() {
    var request = new MockRequest(digestApp);
    var response = doRequest(request, 'GET', '/', {'HTTP_AUTHORIZATION': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='});
    assertBadRequest(response);
};

// should return 400 Bad Request if incorrect uri given
exports.testReturnBadRequestWhenIncorrectUri = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/', 'Alice', 'correct-password', {uri: '/foo'});
    assertBadRequest(response);
};

// should return 400 Bad Request if incorrect qop given
exports.testReturnBadRequestWhenIncorrectQop = function() {
    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/', 'Alice', 'correct-password', {qop: 'auth-int'});
    assertBadRequest(response);
};

// should challenge if stale nonce given
exports.testChallengeWhenStaleNonce = function() {
    DigestNonce.Nonce.prototype.timeLimit = 1; // 1 millisecond

    var request = new MockRequest(digestApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/', 'Alice', 'correct-password', {wait: 1});

    assertDigestAuthChallenge(response);
    assert.isTrue(response.headers['WWW-Authenticate'].search(/stale=true/) != -1);

    //delete timeLimit for future tests
    delete DigestNonce.Nonce.prototype.timeLimit;    
};

// should not require credentials for unprotected path
exports.testAcceptForUnprotectedPath = function() {
    var request = new MockRequest(partiallyProtectedApp);
    var response = doRequest(request, 'GET', '/');

    assert.eq(200, response.status);
};

// should challenge for protected path
exports.testChallengeForProtectedPath = function() {
    var request = new MockRequest(partiallyProtectedApp);
    var response = doRequest(request, 'GET', '/protected');

    assertDigestAuthChallenge(response);
};

// should accept correct credentials for protected path
exports.testAcceptCorrectCredentialsForProtectedPath = function() {
    var request = new MockRequest(partiallyProtectedApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/protected', 'Alice', 'correct-password');

    assert.eq(200,                  response.status);
    assert.eq("Hi Alice",           response.body.toString());
};

// should challenge incorrect credentials for protected path
exports.testChallengeIncorrectCredentialsForProtectedPath = function() {
    var request = new MockRequest(partiallyProtectedApp);
    var response = doRequestWithDigestAuth(request, 'GET', '/protected', 'Alice', 'incorrect-password');

    assertDigestAuthChallenge(response);
};