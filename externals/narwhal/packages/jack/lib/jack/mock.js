var URI = require("uri").URI,
    ByteString = require("binary").ByteString,
    ByteIO = require("io").ByteIO;

var Lint = require("jack/lint").Lint;

/**
 * MockRequest helps testing your Jack application without actually using HTTP.
 *
 * After performing a request on a URL with get/post/put/delete, it returns a 
 * MockResponse with useful helper methods for effective testing.
 */
var MockRequest = exports.MockRequest = function(app) {
    if(!(this instanceof MockRequest))
        return new MockRequest(app);

    this.app = app;
}

MockRequest.prototype.GET = function(uri, opts) {
    return this.request("GET", uri, opts);
}

MockRequest.prototype.POST = function(uri, opts) {
    return this.request("POST", uri, opts);
}

MockRequest.prototype.PUT = function(uri, opts) {
    return this.request("PUT", uri, opts);
}

MockRequest.prototype.DELETE = function(uri, opts) {
    return this.request("DELETE", uri, opts);
}

MockRequest.prototype.request = function(method, uri, opts) {
    opts = opts || {};

    var env = MockRequest.envFor(method, uri, opts),
        app = this.app;
    
    if (opts.lint)
        app = Lint(app)
    
    return new MockResponse(app(env), env["jsgi.errors"]);
}
    
MockRequest.envFor = function(method, uri, opts) {
    opts = opts || {};
    
    var uri = new URI(uri);

    // DEFAULT_ENV
    var env = {
        "jsgi.version": [0,2],
        "jsgi.input": opts["jsgi.input"] || new ByteIO(new ByteString()),
        "jsgi.errors": opts["jsgi.errors"] || "",
        "jsgi.multithread": true,
        "jsgi.multiprocess": true,
        "jsgi.run_once": false
    }

    env["REQUEST_METHOD"]   = method || "GET";
    env["HTTP_HOST"]        = uri.host || "example.org";
    env["SERVER_NAME"]      = uri.host || "example.org";
    env["SERVER_PORT"]      = (uri.port || 80).toString(10);
    env["QUERY_STRING"]     = uri.query || "";
    env["PATH_INFO"]        = uri.path || "/";
    env["jsgi.url_scheme"]  = uri.scheme || "http";

    env["SCRIPT_NAME"]      = opts["SCRIPT_NAME"] || "";

    env["CONTENT_LENGTH"]   = env["jsgi.input"].length.toString(10);

    // FIXME: JS can only have String keys unlike Ruby, so we're dumping all opts into the env here.
    for (var i in opts)
        if (!env[i])
            env[i] = opts[i];

    // FIXME:
    //if (typeof env["jsgi.input"] == "string")
    //   env["jsgi.input"] = StringIO(env["jsgi.input"])

    return env;
}

/**
 * MockResponse provides useful helpers for testing your apps. Usually, you 
 * don't create the MockResponse on your own, but use MockRequest.
 */
var MockResponse = exports.MockResponse = function(response, errors) {
    if(!(this instanceof MockResponse))
        return new MockResponse(response, errors);
    
    this.status = response.status;
    this.headers = response.headers;
 
    this.body = "";
    response.body.forEach(function(chunk) {
        this.body += chunk.toByteString().decodeToString();
    }, this);
    
    this.errors = errors || "";
};

MockResponse.prototype.match = function(regex) {
    return this.body.match(new RegExp(regex));    
};

