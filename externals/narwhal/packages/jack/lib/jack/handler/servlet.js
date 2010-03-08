// Similar in structure to Rack's Mongrel handler.
// All generic Java servlet code should go in here.
// Specific server code should go in separate handlers (i.e. jetty.js, etc)

var IO = require("io").IO,
    file = require("file"),
    HashP = require("hashp").HashP;

var Servlet = exports.Servlet = function(app) {
    this.app = app;
}

Servlet.prototype.process = function(request, response) {
    Servlet.process(this.app, request, response);
}
    
Servlet.process = function(app, request, response) {
    var env = {};
    
    // copy HTTP headers over, converting where appropriate
    for (var e = request.getHeaderNames(); e.hasMoreElements();)
    {
        var name = String(e.nextElement()),
            value = String(request.getHeader(name)), // FIXME: only gets the first of multiple
            key = name.replace("-", "_").toUpperCase();
        
        if (key != "CONTENT_LENGTH" && key != "CONTENT_TYPE")
            key = "HTTP_" + key;
        
        env[key] = value;
    }
    
    env["SCRIPT_NAME"]          = String(request.getServletPath() || "");
    env["PATH_INFO"]            = String(request.getPathInfo() || "");
    
    env["REQUEST_METHOD"]       = String(request.getMethod() || "");
    env["SERVER_NAME"]          = String(request.getServerName() || "");
    env["SERVER_PORT"]          = String(request.getServerPort() || "");
    env["QUERY_STRING"]         = String(request.getQueryString() || "");
    env["SERVER_PROTOCOL"]      = String(request.getProtocol() || "");
    env["HTTP_VERSION"]         = env["SERVER_PROTOCOL"]; // legacy
    
    env["REMOTE_HOST"]          = String(request.getRemoteHost() || "");
    env["REMOTE_ADDR"]          = String(request.getRemoteAddr() || "");
        
    env["jsgi.version"]         = [0,2];
    env["jsgi.input"]           = new IO(request.getInputStream(), null);
    env["jsgi.errors"]          = system.stderr;
    env["jsgi.multithread"]     = true;
    env["jsgi.multiprocess"]    = true;
    env["jsgi.run_once"]        = false;
    env["jsgi.url_scheme"]      = request.isSecure() ? "https" : "http";
    
    // efficiently serve files if the server supports it
    env["HTTP_X_ALLOW_SENDFILE"] = "yes";
    
    // call the app
    var res = app(env);
    
    // set the status
    response.setStatus(res.status);
    
    // check to see if X-Sendfile was used, remove the header
    var sendfilePath = null;
    if (HashP.includes(res.headers, "X-Sendfile")) {
        sendfilePath = HashP.unset(res.headers, "X-Sendfile");
        HashP.set(res.headers, "Content-Length", String(file.size(sendfilePath)));
    }
    
    // set the headers
    for (var key in res.headers) {
        res.headers[key].split("\n").forEach(function(value) {
            response.addHeader(key, value);
        });
    }

    // determine if the response should be chunked (FIXME: need a better way?)
    var chunked = HashP.includes(res.headers, "Transfer-Encoding") && HashP.get(res.headers, "Transfer-Encoding") !== 'identity';
    
    var os = response.getOutputStream(),
        output = new IO(null, os);

    // X-Sendfile send
    if (sendfilePath) {
        var cIn  = new java.io.FileInputStream(sendfilePath).getChannel(),
            cOut = java.nio.channels.Channels.newChannel(os);

        cIn.transferTo(0, cIn.size(), cOut);

        cIn.close();
        cOut.close();
    }
    
    // output the body, flushing after each write if it's chunked
    res.body.forEach(function(chunk) {
        if (!sendfilePath) {
            //output.write(new java.lang.String(chunk).getBytes("US-ASCII"));
            //output.write(chunk, "US-ASCII");
            output.write(chunk);

            if (chunked)
                response.flushBuffer(); //output.flush();
        }
    });

    output.close();
}
