exports.run = function(app, request, response) {
    var env = {};
    
    // copy CGI variables
    for (var key in request._headers)
        env[key] = request._headers[key];

    env["HTTP_VERSION"]         = env["SERVER_PROTOCOL"]; // legacy
    
    env["jsgi.version"]         = [0,2];
    env["jsgi.input"]           = null; // FIXME
    env["jsgi.errors"]          = system.stderr;
    env["jsgi.multithread"]     = false;
    env["jsgi.multiprocess"]    = true;
    env["jsgi.run_once"]        = true;
    env["jsgi.url_scheme"]      = "http"; // FIXME
    
    // call the app
    var res = app(env);
    
    // set the status
    response.status(res.status);
    
    // set the headers
    response.header(res.headers);
    
    // output the body
    res.body.forEach(function(bytes) {
        response.write(bytes.toByteString("UTF-8").decodeToString("UTF-8"));
    });
}
