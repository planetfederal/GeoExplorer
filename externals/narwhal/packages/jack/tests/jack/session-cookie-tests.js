var assert = require("test/assert"),
    Jack = require("jack"),
    Request = require("jack/request").Request,
    Response = require("jack/response").Response,
    MockRequest = require("jack/mock").MockRequest,
    Cookie = require("jack/session/cookie").Cookie;

var helloApp = function(block) {
    return Jack.URLMap({
        "/": function(env) {
            block(env);
            return {
                status: 200,
                headers: { 'Content-Type': 'text/html'},
                body: ["hello"]
            };
        }
    });
};

exports.testCreatesNewCookie = function(){
    var env = MockRequest.envFor(null, "", {});

    var setMyKey = function(env){
        env["jsgi.session"]["mykey"] = "myval";
    };

    var app = helloApp(setMyKey);

    var response = new MockRequest(new Cookie(app, { secret: "secret" })).GET("/");

    assert.isTrue(response.headers["Set-Cookie"] != undefined, "Should have defined 'Set-Cookie'");
    assert.isTrue(response.headers["Set-Cookie"].match(/jsgi.session=/g) != null, "Should have created a new cookie");
}

exports.testRetrieveSessionValue = function(){
    var retrievedVal = null;

    var retrieveMyKey = function(env) {
        retrievedVal = env["jsgi.session"]["mykey"];
    };

    var app = helloApp(retrieveMyKey);

    new MockRequest(new Cookie(app, {secret: "secret" })).GET("/", { "HTTP_COOKIE": "jsgi.session=%7B%22mykey%22%3A%22myval%22%7D--2m6GuCKsHcPfqaI2Yezhy7kdo%2Fg%3D" });

    assert.isEqual("myval", retrievedVal);
}

