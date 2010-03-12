var File = require("./file").File;
var FILE = require("file");

var Static = exports.Static = function(app, options) {
    var options = options || {},
        urls = options["urls"] || ["/favicon.ico"],
        root = options["root"] || FILE.cwd(),
        fileServer = File(root, options);
    
    return function(env) {
        var path = env["PATH_INFO"];

        for (var i = 0; i < urls.length; i++)
            if (path.indexOf(urls[i]) === 0)
                return fileServer(env);
        
        return app(env);
    }
}
