var ASSETS = require("./assets");
var TSORT = require("./tsort");
var FILE = require("file");

var _getOrderedAssets = function(first, include, exclude, last, assets) {

    // no include means include all
    if (include.length === 0) {
        for (var path in assets) {
            include.push(path);
        }
    }

    // determine which files to omit from implicit includes
    var omit = {};
    exclude.forEach(function(path) {
        omit[path] = true;
    });

    var unordered = {};
    first.concat(include, last).forEach(function(path) {
        if (!(omit[path])) {
            unordered[path] = true;
        }
    });
    
    // pull in all includes and requires declared in code
    unordered = expand(unordered, omit, assets);
    for (var path in unordered) {
        unordered[path] = assets[path].requires;
    };
    
    // topo sort of assets based on requires
    var ordered = TSORT.sort(unordered);
    
    // pull out any assets declared in first or last
    ordered = ordered.filter(function(asset) {
        return (first.indexOf(asset) < 0 && last.indexOf(asset) < 0);
    });
    
    // order based on first, includes (sorted by requires), last
    return first.concat(ordered, last);

};

var expand = function(unordered, omit, assets) {
    var path, entry, require, include, newlyIncluded, expanded = true;
    while (expanded) {
        expanded = false;
        newlyIncluded = {};
        for (path in unordered) {
            newlyIncluded[path] = true;
            // expand to include requires & includes from assets
            entry = assets[path];
            if (entry) {
                for (require in entry.requires) {
                    if (!(unordered[require])) {
                        expanded = true;
                        newlyIncluded[require] = true;
                    }
                }
                for (include in entry.includes) {
                    if (!(omit[include]) && (!(unordered[include]))) {
                        expanded = true;
                        newlyIncluded[include] = true;
                    }
                }
            } else {
                throw "Entry not found in assets: " + path;
            }
        }
        unordered = newlyIncluded;
    }
    return unordered;
};

var order = function(config) {
    var base = FILE.path(config.root[0]);
    var assets = ASSETS.compile(base);
    
    var first = config.first || [];
    var include = config.include || [];
    var exclude = config.exclude || [];
    var last = config.last || [];
    
    return _getOrderedAssets(first, include, exclude, last, assets);
};

var concat = function(config) {
    var base = FILE.path(config.root[0]);
    var sources = order(config).map(function(path) {
        var source = "/** FILE: " + path + " **/\n";
        return source + FILE.read(FILE.join(base, path));
    });
    return sources.join("\n");
};

exports._getOrderedAssets = _getOrderedAssets;
exports.order = order;
exports.concat = concat;
