var FILE = require("file"),
    Utils = require("./utils"),
    MIME = require("./mime");

exports.File = function(root, options) {
    root = FILE.path(root).absolute();
    options = options || {};
    var indexes = options.indexes || [];
    if (typeof indexes === "string")
        indexes = [indexes];

    return function(env) {
        var pathInfo = Utils.unescape(env["PATH_INFO"]);

        if (pathInfo.indexOf("..") >= 0)
            return Utils.responseForStatus(403);

        var path = pathInfo ? root.join(pathInfo) : root;

        try {
            if (path.isFile() && path.isReadable()) {
                return serve(path, env["HTTP_X_ALLOW_SENDFILE"]);
            }
            else if (indexes.length > 0 && path.isDirectory()) {
                for (var i = 0; i < indexes.length; i++) {
                    var indexPath = path.join(indexes[i]);
                    if (indexPath.isFile() && indexPath.isReadable())
                        return serve(indexPath, env["HTTP_X_ALLOW_SENDFILE"]);
                }
            }
        } catch(e) {
            env["jsgi.errors"].print("Jack.File error: " + e);
        }

        return Utils.responseForStatus(404, pathInfo);
    }
}

function serve(path, allowSendfile) {
    // TODO: once we have streams that respond to forEach, just return the stream.
    // efficiently serve files if the server supports "X-Sendfile"
    if (allowSendfile) {
        return {
            status : 200,
            headers : {
                "X-Sendfile"        : path.toString(),
                "Content-Type"      : MIME.mimeType(path.extension(), "text/plain"),
                "Content-Length"    : "0"
            },
            body : []
        };
    } else {
        var body = path.read({ mode : "b" });
        return {
            status : 200,
            headers : {
                "Last-Modified"  : path.mtime().toUTCString(),
                "Content-Type"   : MIME.mimeType(path.extension(), "text/plain"),
                "Content-Length" : body.length.toString(10)
            },
            body : [body]
        }
    }
}
