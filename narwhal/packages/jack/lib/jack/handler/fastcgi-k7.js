var ByteString = require("binary").ByteString;

exports.run = function(app) {
    var f = new net.http.server.fcgi.FCGI();

    while (f.accept() >= 0) {
        var fcgiEnv = f.getEnv(),
            env = {};
            
        for (var key in fcgiEnv) {
            var newKey = key
            if (newKey === "HTTP_CONTENT_LENGTH")
                newKey = "CONTENT_LENGTH";
            else if (newKey === "HTTP_CONTENT_TYPE")
                newKey = "CONTENT_TYPE";
            env[newKey] = fcgiEnv[key];
        }
        
        if (env["SCRIPT_NAME"] === "/") {
            env["SCRIPT_NAME"] = "";
            env["PATH_INFO"] = "/";
        }
        
        env["jsgi.version"]         = [0,2];
        
        var input = f.getRawRequest(),
            offset = 0;
        env["jsgi.input"]           = {
            read : function(length) {
                var read;
                if (typeof length === "number")
                    read = input.substring(offset, offset+length);
                else
                    read = input.substring(offset);
                offset += read.length;
                return new ByteString(read);
            },
            close : function(){}
        }
        
        env["jsgi.errors"]          = system.stderr;
        env["jsgi.multithread"]     = false;
        env["jsgi.multiprocess"]    = true;
        env["jsgi.run_once"]        = true;
        env["jsgi.url_scheme"]      = "http"; // FIXME
        
        var res = app(env);

        // set the headers
        for (var key in res.headers) {
            res.headers[key].split("\n").forEach(function(value) {
                response.add(key, value);
            });
        }
    	f.write("\r\n");

        res.body.forEach(function(bytes) {
            f.write(bytes.toByteString("UTF-8").decodeToString("UTF-8"));
        });
    }

    f.free();
}
