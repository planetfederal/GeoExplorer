var utils = require("./utils"),
    HashP = require("hashp").HashP;

var Lint = exports.Lint = function(app) {
    return function(env) {
        return (new Lint.Context(app)).run(env);
    }
}

Lint.Context = function(app) {
    this.app = app;
}

Lint.Context.prototype.run = function(env) {
    if (!env)
        throw new Error("No env given");
    
    this.checkEnv(env);
    
    var response = this.app(env);
    
    this.body = response.body;
    
    if (typeof this.body === "string")
        throw new Error("Body must implement forEach, String support deprecated.");

    this.checkStatus(response.status);
    this.checkHeaders(response.headers);
    this.checkContentType(response.status, response.headers);
    this.checkContentLength(response.status, response.headers, env);
    
    return {
        status : response.status,
        headers : response.headers,
        body : this
    };
}

Lint.Context.prototype.forEach = function(block) {
    this.body.forEach(function(part) {
        if (part === null || part === undefined || typeof part.toByteString !== "function")
            throw new Error("Body yielded value that can't be converted to ByteString ("+(typeof part)+","+(typeof part.toByteString)+"): " + part);
        block(part);
    });
}

Lint.Context.prototype.close = function() {
    if (this.body.close)
        return this.body.close();
}

Lint.Context.prototype.checkEnv = function(env) {
    if (env && typeof env !== "object" || env.constructor !== Object)
        throw new Error("env is not a hash");
    
    ["REQUEST_METHOD","SERVER_NAME","SERVER_PORT","QUERY_STRING",
    "jsgi.version","jsgi.input","jsgi.errors","jsgi.multithread",
    "jsgi.multiprocess","jsgi.run_once"].forEach(function(key) {
        if (env[key] === undefined)
            throw new Error("env missing required key " + key);
    });
    
    // The environment must not contain the keys
    // <tt>HTTP_CONTENT_TYPE</tt> or <tt>HTTP_CONTENT_LENGTH</tt>
    // (use the versions without <tt>HTTP_</tt>).
    ["HTTP_CONTENT_TYPE","HTTP_CONTENT_LENGTH"].forEach(function(key) {
        if (env[key] !== undefined)
            throw new Error("env contains " + key + ", must use " + key.substring(5));
    });
    
    // The CGI keys (named without a period) must have String values.
    for (var key in env)
        if (key.indexOf(".") == -1)
            if (typeof env[key] !== "string")
                throw new Error("env variable " + key + " has non-string value " + env[key]);
    
    // * <tt>jsgi.version</tt> must be an array of Integers.
    if (typeof env["jsgi.version"] !== "object" && !Array.isArray(env["jsgi.version"]))
        throw new Error("jsgi.version must be an Array, was " + env["jsgi.version"]);
        
    // * <tt>rack.url_scheme</tt> must either be +http+ or +https+.
    if (env["jsgi.url_scheme"] !== "http" && env["jsgi.url_scheme"] !== "https")
        throw new Error("jsgi.url_scheme unknown: " + env["jsgi.url_scheme"]);
    
    // * There must be a valid input stream in <tt>jsgi.input</tt>.
    this.checkInput(env["jsgi.input"]);
    // * There must be a valid error stream in <tt>jsgi.errors</tt>.
    this.checkError(env["jsgi.errors"]);
    
    // * The <tt>REQUEST_METHOD</tt> must be a valid token.
    if (!(/^[0-9A-Za-z!\#$%&'*+.^_`|~-]+$/).test(env["REQUEST_METHOD"]))
        throw new Error("REQUEST_METHOD unknown: " + env["REQUEST_METHOD"]);

    // * The <tt>SCRIPT_NAME</tt>, if non-empty, must start with <tt>/</tt>
    if (env["SCRIPT_NAME"] && env["SCRIPT_NAME"].charAt(0) !== "/")
        throw new Error("SCRIPT_NAME must start with /");
    
    // * The <tt>PATH_INFO</tt>, if non-empty, must start with <tt>/</tt>
    if (env["PATH_INFO"] && env["PATH_INFO"].charAt(0) !== "/")
        throw new Error("PATH_INFO must start with /");
    
    // * The <tt>CONTENT_LENGTH</tt>, if given, must consist of digits only.
    if (env["CONTENT_LENGTH"] !== undefined && !(/^\d+$/).test(env["CONTENT_LENGTH"]))
        throw new Error("Invalid CONTENT_LENGTH: " + env["CONTENT_LENGTH"]);

    // * One of <tt>SCRIPT_NAME</tt> or <tt>PATH_INFO</tt> must be
    //   set.  <tt>PATH_INFO</tt> should be <tt>/</tt> if
    //   <tt>SCRIPT_NAME</tt> is empty.
    if (env["SCRIPT_NAME"] === undefined && env["PATH_INFO"] === undefined)
        throw new Error("One of SCRIPT_NAME or PATH_INFO must be set (make PATH_INFO '/' if SCRIPT_NAME is empty)")
        
    //   <tt>SCRIPT_NAME</tt> never should be <tt>/</tt>, but instead be empty.
    if (env["SCRIPT_NAME"] === "/")
        throw new Error("SCRIPT_NAME cannot be '/', make it '' and PATH_INFO '/'")
}
Lint.Context.prototype.checkInput = function(input) {
    // FIXME:
    /*["gets", "forEach", "read"].forEach(function(method) {
        if (typeof input[method] !== "function")
            throw new Error("jsgi.input " + input + " does not respond to " + method);
    });*/
}
Lint.Context.prototype.checkError = function(error) {
    ["print", "write", "flush"].forEach(function(method) {
        if (typeof error[method] !== "function")
            throw new Error("jack.error " + error + " does not respond to " + method);
    });
}
Lint.Context.prototype.checkStatus = function(status) {
    if (!(parseInt(status) >= 100))
        throw new Error("Status must be >=100 seen as integer");
}
Lint.Context.prototype.checkHeaders = function(headers) {
    for (var key in headers) {
        var value = headers[key];
        // The header keys must be Strings.
        if (typeof key !== "string")
            throw new Error("header key must be a string, was " + key);
            
        // The header must not contain a +Status+ key,
        if (key.toLowerCase() === "status")
            throw new Error("header must not contain Status");
        // contain keys with <tt>:</tt> or newlines in their name,
        if ((/[:\n]/).test(key))
            throw new Error("header names must not contain : or \\n");
        // contain keys names that end in <tt>-</tt> or <tt>_</tt>,
        if ((/[-_]$/).test(key))
            throw new Error("header names must not end in - or _");
        // but only contain keys that consist of
        // letters, digits, <tt>_</tt> or <tt>-</tt> and start with a letter.
        if (!(/^[a-zA-Z][a-zA-Z0-9_-]*$/).test(key))
            throw new Error("invalid header name: " + key);
        // The values of the header must respond to #forEach.
        if (typeof value !== "string")
            throw new Error("header values must be strings, but the value of '" + key + "' isn't: " + value + "(" + (typeof value) + ")")
            
        value.split("\n").forEach(function(item) {
            // must not contain characters below 037.
            if ((/[\000-\037]/).test(item))
                throw new Error("invalid header value " + key + ": " + item);
        });
    }
}
Lint.Context.prototype.checkContentType = function(status, headers) {
    var contentType = HashP.includes(headers, "Content-Type"),
        noBody = utils.STATUS_WITH_NO_ENTITY_BODY(parseInt(status));
    
    if (noBody && contentType)
        throw new Error("Content-Type header found in " + status + " response, not allowed");
    if (!noBody && !contentType)
        throw new Error("No Content-Type header found");
}
Lint.Context.prototype.checkContentLength = function(status, headers, env) {
    var chunked_response = (HashP.includes(headers, "Transfer-Encoding") && HashP.get(headers, "Transfer-Encoding") !== 'identity');
    
    if (HashP.includes(headers, "Content-Length")) {
        var value = HashP.get(headers, "Content-Length");
        // There must be a <tt>Content-Length</tt>, except when the
        // +Status+ is 1xx, 204 or 304, in which case there must be none
        // given.
        if (utils.STATUS_WITH_NO_ENTITY_BODY(parseInt(status)))
            throw new Error("Content-Length header found in " + status + " response, not allowed");

        if (chunked_response)
            throw new Error('Content-Length header should not be used if body is chunked');

        var bytes = 0,
            string_body = true;

        this.body.forEach(function(part) {
            if (typeof part !== "string")
                string_body = false;
            bytes += (part && part.length) ? part.length : 0;
        });

        if (env["REQUEST_METHOD"] === "HEAD")
        {
            if (bytes !== 0)
                throw new Error("Response body was given for HEAD request, but should be empty");
        }
        else if (string_body)
        {
            if (value !== bytes.toString())
                throw new Error("Content-Length header was "+value+", but should be " + bytes);
        }
    }
    else {
        if (!chunked_response && (typeof this.body === "string" || Array.isArray(this.body)))
            if (!utils.STATUS_WITH_NO_ENTITY_BODY(parseInt(status)))
                throw new Error('No Content-Length header found');
    }
}
