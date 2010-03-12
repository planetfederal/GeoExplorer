var assert = require("test/assert"),
    Request = require("jack/request").Request,
    MockRequest = require("jack/mock").MockRequest;

exports.testParseCookies = function() {
    var req = new Request(MockRequest.envFor(null, "", { "HTTP_COOKIE" : "foo=bar;quux=h&m" }));
    
    assert.isSame({"foo" : "bar", "quux" : "h&m"}, req.cookies());
    assert.isSame({"foo" : "bar", "quux" : "h&m"}, req.cookies());
    delete req.env["HTTP_COOKIE"];
    assert.isSame({}, req.cookies());
}

exports.testParseCookiesRFC2109 = function() {
    var req = new Request(MockRequest.envFor(null, "", { "HTTP_COOKIE" : "foo=bar;foo=car" }));
    
    assert.isSame({"foo" : "bar"}, req.cookies());
}

exports.testMediaType = function() {
    var req = new Request(MockRequest.envFor(null, "", { "CONTENT_TYPE" : "text/html" }));
    assert.isEqual(req.mediaType(), "text/html");
    assert.isEqual(req.contentType(), "text/html");
    
    var req = new Request(MockRequest.envFor(null, "", { "CONTENT_TYPE" : "text/html; charset=utf-8" }));
    assert.isEqual(req.mediaType(), "text/html");
    assert.isEqual(req.contentType(), "text/html; charset=utf-8");
    assert.isEqual(req.mediaTypeParams()["charset"], "utf-8");
    assert.isEqual(req.contentCharset(), "utf-8");
    
    var req = new Request(MockRequest.envFor(null, "", {}));
    assert.isEqual(req.mediaType(), null);
    assert.isEqual(req.contentType(), null);
}

exports.testHasFormData = function() {
    var req = new Request(MockRequest.envFor(null, "", { "CONTENT_TYPE" : "application/x-www-form-urlencoded" }));
    assert.isEqual(req.hasFormData(), true);
    
    var req = new Request(MockRequest.envFor(null, "", { "CONTENT_TYPE" : "multipart/form-data" }));
    assert.isEqual(req.hasFormData(), true);
    
    var req = new Request(MockRequest.envFor(null, "", {}));
    assert.isEqual(req.hasFormData(), true);
    
    var req = new Request(MockRequest.envFor(null, "", { "CONTENT_TYPE" : "text/html" }));
    assert.isEqual(req.hasFormData(), false);
}
