// handler for Simple (http://simpleweb.sourceforge.net/) based on the servlet handler

var IO = require("io").IO,
    file = require("file"),
    HashP = require("hashp").HashP,
    URI = require("uri"),
    HTTP_STATUS_CODES = require("../utils").HTTP_STATUS_CODES;

exports.run = function(app, options) {
    var options = options || {};
    
    // need to use JavaAdapter form when using module scoping for some reason
    var handler = new JavaAdapter(Packages.org.simpleframework.http.core.Container, {
        handle : function(request, response) {
            try {
                process(app, request, response);
            } catch (e) {
                print("ERROR: " + e + " ["+e.message+"]");
                if (e.rhinoException)
                    e.rhinoException.printStackTrace();
                else if (e.javaException)
                    e.javaException.printStackTrace();
                throw e;
            }
        }
    });
    
    // different version
    var port = options["port"] || 8080,
        address = options["host"] ? new Packages.java.net.InetSocketAddress(options["host"], port) : new Packages.java.net.InetSocketAddress(port),
        connection;
        
    if (typeof Packages.org.simpleframework.transport.connect.SocketConnection === "function")
        connection = new Packages.org.simpleframework.transport.connect.SocketConnection(handler);
    else if (typeof Packages.org.simpleframework.http.connect.SocketConnection === "function")
        connection = new Packages.org.simpleframework.http.connect.SocketConnection(handler);
    else
        throw new Error("Simple SocketConnection not found, missing .jar?");
    
    print("Jack is starting up using Simple on port " + port);
    
    connection.connect(address);
}

var process = function(app, request, response) {
    var env = {};
    
    // copy HTTP headers over, converting where appropriate
    for (var e = request.getNames().iterator(); e.hasNext();) {
        var name = String(e.next()),
            value = String(request.getValue(name)), // FIXME: only gets the first of multiple
            key = name.replace(/-/g, "_").toUpperCase();
        
        if (key != "CONTENT_LENGTH" && key != "CONTENT_TYPE")
            key = "HTTP_" + key;

        env[key] = value;
    }
    
    var address = request.getAddress();

    if (env["HTTP_HOST"]) {
        var parts = env["HTTP_HOST"].split(":");
        if (parts.length === 1) {
            env["SERVER_NAME"] = parts[0];
        }
        else if (parts.length === 2) {
            env["SERVER_NAME"] = parts[0];
            env["SERVER_PORT"] = parts[1];
        }
    }
    
    var name = address.getDomain(),
        port = address.getPort();
    env["SERVER_NAME"] = env["SERVER_NAME"] || String(name || "");
    env["SERVER_PORT"] = env["SERVER_PORT"] || String(port >= 0 ? port : "");
    
    var uri = URI.parse(String(request.getTarget()));
    env["SCRIPT_NAME"]          = "";
    env["PATH_INFO"]            = uri.path || "";
    
    env["REQUEST_METHOD"]       = String(request.getMethod() || "");
    env["QUERY_STRING"]         = uri.query || "";
    env["SERVER_PROTOCOL"]      = "HTTP/"+request.getMajor()+"."+request.getMinor();
    env["HTTP_VERSION"]         = env["SERVER_PROTOCOL"]; // legacy
    
    var cAddr;
    if (cAddr = request.getClientAddress())
        env["REMOTE_ADDR"]      = String(cAddr.getHostName() || cAddr.getAddress() || "");
    
    env["jsgi.version"]         = [0,2];
    env["jsgi.input"]           = new IO(request.getInputStream(), null);
    env["jsgi.errors"]          = system.stderr;
    env["jsgi.multithread"]     = true;
    env["jsgi.multiprocess"]    = true;
    env["jsgi.run_once"]        = false;
    env["jsgi.url_scheme"]      = String(address.getScheme() || "http");
    
    // efficiently serve files if the server supports it
    env["HTTP_X_ALLOW_SENDFILE"] = "yes";
    
    // call the app
    var res = app(env);
    
    // set the status
    response.setCode(res.status);
    response.setText(HTTP_STATUS_CODES[res.status]);
    
    // check to see if X-Sendfile was used, remove the header
    var sendfilePath = null;
    if (HashP.includes(res.headers, "X-Sendfile")) {
        sendfilePath = HashP.unset(res.headers, "X-Sendfile");
        HashP.set(res.headers, "Content-Length", String(file.size(sendfilePath)));
    }
    
    // set the headers
    for (var key in res.headers) {
        res.headers[key].split("\n").forEach(function(value) {
            response.add(key, value);
        });
    }
    
    // determine if the response should be chunked (FIXME: need a better way?)
    var chunked = HashP.includes(res.headers, "Transfer-Encoding") && HashP.get(res.headers, "Transfer-Encoding") !== 'identity';
    
    var output = new IO(null, response.getOutputStream());
    
    // X-Sendfile send
    if (sendfilePath) {
        var cIn  = new java.io.FileInputStream(sendfilePath).getChannel(),
            cOut = response.getByteChannel();
            
        cIn.transferTo(0, cIn.size(), cOut);
        
        cIn.close();
        cOut.close();
    }
    
    // output the body, flushing after each write if it's chunked
    var possiblePromise = res.body.forEach(function(chunk) {
        if (!sendfilePath) {
            //output.write(new java.lang.String(chunk).getBytes("US-ASCII"));
            //output.write(chunk, "US-ASCII");
            // with async/promises, it would actually be more ideal to set the headers
            // and status here before the first write, so that a promise could suspend
            // and then set status when it resumed
            output.write(chunk);

            if (chunked)
                output.flush();
        }
    });
    
    // check to see if the return value is a promise
    // alternately we could check with if (possiblePromise instanceof require("promise").Promise)
    if (possiblePromise && typeof possiblePromise.then == "function") {
        // its a promise, don't close the output until it is fulfilled
        possiblePromise.then(function() {
                // fulfilled, we are done now
                output.close();
            },
            function(e) {
                // an error, just write the error and finish
                output.write(e.message);
                output.close();
            });
    }
    else {
        // not a promise, regular sync request, we are done now
        output.close();
    }
}
