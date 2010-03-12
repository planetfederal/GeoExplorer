// handler for SHTTPD/Mongoose (http://code.google.com/p/mongoose/)

var IO = require("io").IO,
    HashP = require("hashp").HashP;

exports.run = function(app, options) {
    var options = options || {},
        port = options["port"] || 8080,
        shttpd = options["shttpd"] || net.http.server.shttpd;
        
    var server = new shttpd.Server(port);
    
    server.registerURI(
    	"/*",
    	function (request) {
    	    process(app, request, shttpd);
    	}
    );

    print("Jack is starting up using SHTTPD on port " + port);
        
    while (true) {
        server.processRequests();
    }
}

// Apparently no way to enumerate ENV or headers so we have to check against a list of common ones for now. Sigh.

var ENV_KEYS = [
    "SERVER_SOFTWARE", "SERVER_NAME", "GATEWAY_INTERFACE", "SERVER_PROTOCOL",
    "SERVER_PORT", "REQUEST_METHOD", "PATH_INFO", "PATH_TRANSLATED", "SCRIPT_NAME",
    "QUERY_STRING", "REMOTE_HOST", "REMOTE_ADDR", "AUTH_TYPE", "REMOTE_USER", "REMOTE_IDENT",
    "CONTENT_TYPE", "CONTENT_LENGTH", "HTTP_ACCEPT", "HTTP_USER_AGENT",
    "REQUEST_URI"
];
    
var HEADER_KEYS = [
    "Accept", "Accept-Charset", "Accept-Encoding", "Accept-Language", "Accept-Ranges",
    "Authorization", "Cache-Control", "Connection", "Cookie", "Content-Type", "Date",
    "Expect", "Host", "If-Match", "If-Modified-Since", "If-None-Match", "If-Range",
    "If-Unmodified-Since", "Max-Forwards", "Pragma", "Proxy-Authorization", "Range",
    "Referer", "TE", "Upgrade", "User-Agent", "Via", "Warn"
];

var process = function(app, request, shttpd) {
    try {
        var env = {};
    
        var key, value;
    
        ENV_KEYS.forEach(function(key) {
            if (value = request.getEnv(key))
                env[key] = value;
        });
    
        HEADER_KEYS.forEach(function(key) {
            if (value = request.getHeader(key)) {
                key = key.replace(/-/g, "_").toUpperCase();
                if (!key.match(/(CONTENT_TYPE|CONTENT_LENGTH)/i))
                    key = "HTTP_" + key;
                env[key] = value;
            }
        });

        var hostComponents = env["HTTP_HOST"].split(":")
        if (env["SERVER_NAME"] === undefined && hostComponents[0])
            env["SERVER_NAME"] = hostComponents[0];
        if (env["SERVER_PORT"] === undefined && hostComponents[1])
            env["SERVER_PORT"] = hostComponents[1];
        
        if (env["QUERY_STRING"] === undefined)
            env["QUERY_STRING"] = "";
        
        if (env["PATH_INFO"] === undefined)
            env["PATH_INFO"] = env["REQUEST_URI"];
            
        if (env["SERVER_PROTOCOL"] === undefined)
            env["SERVER_PROTOCOL"] = "HTTP/1.1";
        
        env["HTTP_VERSION"] = env["SERVER_PROTOCOL"]; // legacy
            
        if (env["CONTENT_LENGTH"] === undefined)
            env["CONTENT_LENGTH"] = "0";
            
        if (env["CONTENT_TYPE"] === undefined)
            env["CONTENT_TYPE"] = "text/plain";
        
        env["jsgi.version"]         = [0,2];
        env["jsgi.input"]           = null; // FIXME
        env["jsgi.errors"]          = system.stderr;
        env["jsgi.multithread"]     = false;
        env["jsgi.multiprocess"]    = true;
        env["jsgi.run_once"]        = false;
        env["jsgi.url_scheme"]      = "http"; // FIXME
    
        // call the app
        var response = app(env);
    
        // FIXME: can't set the response status or headers?!
        
        // set the status
        //response.status
    
        // set the headers
        //response.headers
    
        // output the body
        response.body.forEach(function(bytes) {
            request.print(bytes.toByteString("UTF-8").decodeToString("UTF-8"));
        });
        
    } catch (e) {
        print("Exception! " + e);
    } finally {
        request.setFlags(shttpd.END_OF_OUTPUT);
    }
}
