const CC = Components.Constructor;
const BinaryOutputStream = CC("@mozilla.org/binaryoutputstream;1", "nsIBinaryOutputStream", "setOutputStream");
const BinaryInputStream = CC("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream", "setInputStream");
var Log = new (require("logger")).Logger({write: print});
Log.level = 4;
Log.trace = function(object) { print(require("test/jsdump").jsDump.parse(object)) }

// handler for Simple (http://simpleweb.sourceforge.net/) based on the servlet handler
var IO = require("io").IO,
    fs = require("file"),
    HashP = require("hashp").HashP,
    URI = require("uri").URI,
    HTTP_STATUS_CODES = require("../utils").HTTP_STATUS_CODES;

exports.run = function(app, options) {
    var options = options || {};
    var server = new (require("mozhttpd-engine")).Server();
    // overriding default handler
    server._handler._handleDefault = function(request, response) {
        try {
            process(app, request, response);
        } catch(e) {
            Log.error(e);
            Log.error(e.stack);
            throw e;
        }
    };

    // different version
    var port = options["port"] || 8080,
        address = options["host"] || "localhost";
    Log.debug("starting server on port:", port);
    server.start(port);
}

var process = function(app, request, response) {
    Log.debug("request received");
    var env = {};

    // Log.trace(request);
    // copy HTTP headers over, converting where appropriate
    var requestHeaders = request.headers;
    while (requestHeaders.hasMoreElements()) {
        key = new String(requestHeaders.getNext().QueryInterface(Components.interfaces.nsISupportsString));
        value = request.getHeader(key);
        key = key.replace(/-/g, "_").toUpperCase();
        if (!key.match(/(CONTENT_TYPE|CONTENT_LENGTH)/i)) key = "HTTP_" + key;
        env[key] = value;
    }
    Log.debug("headers had bein copied");

    //var address = request.getAddress();

    if (env["HTTP_HOST"]) {
        var parts = env["HTTP_HOST"].split(":");
        if (parts.length === 2)
        {
            env["SERVER_NAME"] = parts[0];
            env["SERVER_PORT"] = parts[1];
        }
    }

    var uri = URI.parse(request.target);

    env["SERVER_NAME"] = env["SERVER_NAME"] || "mozhttpd";
    env["SERVER_PORT"] = env["SERVER_PORT"] || request.port;

    env["SCRIPT_NAME"]          = "";
    env["PATH_INFO"]            = uri.path || request.path || "";

    env["REQUEST_METHOD"]       = request.method || "";
    env["QUERY_STRING"]         = uri.query || request.queryString || "";
    env["SERVER_PROTOCOL"]      = ["HTTP/", request.httpVersion || "1.1"].join("");
    env["HTTP_VERSION"]         = env["SERVER_PROTOCOL"]; // legacy

    var cAddr, addr;
    //if (cAddr = request.getClientAddress())
    //    env["REMOTE_ADDR"]      = String(cAddr.getHostName() || cAddr.getAddress() || "");

    env["jsgi.version"]         = [0,2];
    env["jsgi.input"]           = new IO(new BinaryInputStream(request.bodyInputStream), null);
    env["jsgi.errors"]          = {
        print: system.print,
        flush: function() {},
        write: function() {
            dump(Array.prototype.join.call(arguments, " "));
        }
    }; //system.stderr;
    env["jsgi.multithread"]     = true;
    env["jsgi.multiprocess"]    = false;
    env["jsgi.run_once"]        = false;
    env["jsgi.url_scheme"]      = request.scheme || uri.scheme || "http";

    // efficiently serve files if the server supports it
    env["HTTP_X_ALLOW_SENDFILE"] = "yes";

    for (var key in env)
        Log.debug(key, ":", env[key])
    // call the app
    var res = app(env);

    Log.debug("response has been processed by app", res);

    Object.keys(response).forEach(function(key) {
        print(key + " : " + response[key]);
    });
    // set the status
    Log.debug("set the status", env["SERVER_PROTOCOL"], res.status, HTTP_STATUS_CODES[res.status]);
    response.setStatusLine(request.httpVersion || "1.1", res.status, HTTP_STATUS_CODES[res.status]);

    // check to see if X-Sendfile was used, remove the header
    var sendfilePath = null;
    if (HashP.includes(res.headers, "X-Sendfile")) {
        sendfilePath = HashP.unset(res.headers, "X-Sendfile");
        Log.debug("check to see if X-Sendfile was used, remove the header", sendfilePath);
        HashP.set(res.headers, "Content-Length", new String(fs.size(sendfilePath)));
    }

    // set the headers
    for (var key in res.headers) {
        Log.debug(">> set header", key, res.headers[key]);
        try {
            response.setHeader(key, res.headers[key], false);
        } catch(e) {
            Log.error(e)
        }
    }
    Log.debug("set the headers");

    // determine if the response should be chunked (FIXME: need a better way?)
    var chunked = HashP.includes(res.headers, "Transfer-Encoding") && HashP.get(res.headers, "Transfer-Encoding") !== 'identity';


    // X-Sendfile send
    if (sendfilePath) {
        fs.FileIO(sendfilePath, "r").copy(response.bodyOutputStream);
        response.bodyOutputStream.flush();
    }

    var output = new IO(null, new BinaryOutputStream(response.bodyOutputStream));
    // output the body, flushing after each write if it's chunked
    res.body.forEach(function(chunk) {
        if (!sendfilePath) {
            //output.write(new java.lang.String(chunk).getBytes("US-ASCII"));
            //output.write(chunk, "US-ASCII");
            output.write(chunk);
            if (chunked) output.flush();
        }
    });
    //output.close();
}