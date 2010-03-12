// this uses the Java JNA library to invoke libfcgi from Java. Incomplete.

exports.run = function(app, options) {
    var fcgi = Packages.com.sun.jna.NativeLibrary.getInstance("/opt/local/lib/libfcgi.dylib"),
        FCGX_Init = fcgi.getFunction("FCGX_Init"),
        FCGI_Accept = fcgi.getFunction("FCGI_Accept"),
        FCGI_puts = fcgi.getFunction("FCGI_puts");
    
    FCGX_Init.invoke([]);
    
    while (FCGI_Accept.invokeInt([]) >= 0) {
        var env = {};
        
        env["CONTENT_LENGTH"]       = "0";
        env["CONTENT_TYPE"]         = "text/plain";
        
        env["SCRIPT_NAME"]          = "";//String(request.getServletPath() || "");
        env["PATH_INFO"]            = "/";//String(request.getPathInfo() || "");
        
        env["REQUEST_METHOD"]       = "GET";//String(request.getMethod() || "");
        env["SERVER_NAME"]          = "localhost";//String(request.getServerName() || "");
        env["SERVER_PORT"]          = "";//String(request.getServerPort() || "");
        env["QUERY_STRING"]         = "";//String(request.getQueryString() || "");
        env["SERVER_PROTOCOL"]      = "HTTP/1.1";//String(request.getProtocol() || "");
        env["HTTP_VERSION"]         = env["SERVER_PROTOCOL"]; // legacy

        env["REMOTE_HOST"]          = "127.0.0.1";
        
        env["HTTP_HOST"]            = "localhost";

        env["jsgi.version"]         = [0,2];
        env["jsgi.input"]           = system.stdin;
        env["jsgi.errors"]          = system.stderr;
        env["jsgi.multithread"]     = true;
        env["jsgi.multiprocess"]    = true;
        env["jsgi.run_once"]        = false;
        env["jsgi.url_scheme"]      = "http";
        
        var response = app(env);
            
        FCGI_puts.invoke(["Content-Type: text/html\n"]);
        
        response.body.forEach(function(data) {
            FCGI_puts.invoke([data.toByteString().decodeToString()]);
        });
    }
}
