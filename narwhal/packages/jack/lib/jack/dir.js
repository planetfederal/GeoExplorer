var file = require("file"),
    sprintf = require("printf").sprintf,
    utils = require("./utils"),
    mimeType = require("./mime").mimeType;

var DIR_FILE =
'<tr>\n\
    <td class="name"><a href="%s">%s</a></td>\n\
    <td class="size">%s</td>\n\
    <td class="type">%s</td>\n\
    <td class="mtime">%s</td>\n\
</tr>';

var DIR_PAGE =
'<html><head>\n\
<title>%s</title>\n\
<meta http-equiv="content-type" content="text/html; charset=utf-8" />\n\
<style type="text/css">\n\
    table { width:100%%; }\n\
    .name { text-align:left; }\n\
    .size, .mtime { text-align:right; }\n\
    .type { width:11em; }\n\
    .mtime { width:15em; }\n\
</style>\n\
</head><body>\n\
<h1>%s</h1>\n\
<hr />\n\
<table>\n\
<tr>\n\
    <th class="name">Name</th>\n\
    <th class="size">Size</th>\n\
    <th class="type">Type</th>\n\
    <th class="mtime">Last Modified</th>\n\
</tr>\n\
%s\n\
</table>\n\
<hr />\n\
</body>\n</html>';

exports.Directory = function(root, app) {
    root = file.absolute(root);
    app = app || require("./file").File(root);
    return function(env) {
        var scriptName = utils.unescape(env["SCRIPT_NAME"]),
            pathInfo = utils.unescape(env["PATH_INFO"]);
        
        if (pathInfo.indexOf("..") >= 0)
            return utils.responseForStatus(403);
    
        var path = file.join(root, pathInfo);
    
        if (file.isReadable(path)) {
            if (file.isFile(path)) {
                return app(env);
            }
            else if (file.isDirectory(path)) {
                var body = generateListing(root, pathInfo, scriptName).toByteString("UTF-8");
                return {
                    status : 200,
                    headers : { "Content-Type" : "text/html; charset=utf-8", "Content-Length" : String(body.length)}, 
                    body : [body]
                };
            }
        }
        return utils.responseForStatus(404, pathInfo);
    }
}

function generateListing(root, pathInfo, scriptName) {
    var filesData = [["../","Parent Directory","","",""]];
    
    var dirname = file.join(root, pathInfo),
        list = file.list(dirname);
        
    filesData.push.apply(filesData, list.map(function(basename) {
        var path = file.join(dirname, basename),
            ext = file.extension(basename),
            isDir = file.isDirectory(path),
            url = file.join(scriptName, pathInfo, basename),
            size = isDir ? "-" : byteSizeFormat(file.size(path)),
            type = isDir ? "directory" : mimeType(ext),
            mtime = file.mtime(path).toUTCString();
        
        if (isDir) {
            url = url + "/";
            basename = basename + "/";
        }
        
        return [url, basename, size, type, mtime];
    }));
    
    var files = filesData.map(function(file) {
        return sprintf(DIR_FILE, file[0], file[1], file[2], file[3], file[4]);
    }).join("\n");
    
    return sprintf(DIR_PAGE, pathInfo, pathInfo, files);
}

function byteSizeFormat(size) {
    var tier = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
    return sprintf(["%dB","%.1fK","%.1fM","%.1fG","%.1fT"][tier], size / Math.pow(1024, tier));
}

exports.app = exports.Directory(file.cwd());
