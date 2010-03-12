var HTTP_STATUS_CODES = require("jack/utils").HTTP_STATUS_CODES;

var lineEnding = "\n";

exports.run = function(app) {
    var input  = system.stdin.raw;
    var output = system.stdout.raw;
    var error  = system.stderr;

    var env = {};
    
    // copy CGI variables
    for (var key in system.env)
        env[key] = system.env[key];

    env["jsgi.version"]         = [0,2];
    env["jsgi.input"]           = input;
    env["jsgi.errors"]          = error;
    env["jsgi.multithread"]     = false;
    env["jsgi.multiprocess"]    = true;
    env["jsgi.run_once"]        = true;
    env["jsgi.url_scheme"]      = "http";
    
    // call the app
    var result;
    try {
        result = app(env);
    } catch (e) {
        result = {
            status : 500,
            headers : {},
            body : ["Internal Server Error"]
        };
    }
    
    // status line
    result.headers["Status"] = result.status + " " + (HTTP_STATUS_CODES[result.status] || "Unknown");
    
    // headers
    for (var name in result.headers) {
        var values = result.headers[name].split(/\n/g);
        values.forEach(function(value) {
            output.write((name + ": " + value + lineEnding).toByteString("UTF-8"));
        });
    }
    
    // end headers
    output.write(lineEnding.toByteString("UTF-8"));
    output.flush();
    
    // body
    result.body.forEach(function(bytes) {
        output.write(bytes.toByteString("UTF-8"));
        output.flush();
    });
    
    output.flush();
    output.close();
}
