var FILE = require("file");

var JS_RE = /\.js$/;
var REQUIRE_RE = /^\s\**\s*@requires?\s+([\w\/]+\.js)\s*$/;
var INCLUDE_RE = /^\s\**\s*@includes?\s+([\w\/]+\.js)\s*$/;

var compile = function(base) {
    var assets = {};
    FILE.listTree(base).forEach(function(path) {
        if (FILE.isFile(FILE.join(base, path)) && JS_RE.test(path)) {
            assets[path] = getDependencies(base, path);
        }
    });
    return assets;    
};

var getDependencies = function(base, path) {
    var source = FILE.read(FILE.join(base, path));
    var requires = {};
    var includes = {};
    source.split("\n").forEach(function(line) {
        var match = line.match(REQUIRE_RE);
        if (match) {
            requires[match[1]] = true;
        }
        match = line.match(INCLUDE_RE);
        if (match) {
            includes[match[1]] = true;
        }
    });
    return {
        includes: includes,
        requires: requires
    };
};

exports.compile = compile;
