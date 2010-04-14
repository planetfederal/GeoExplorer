var FILE = require("file");
var URLMap = require("jack").URLMap;
var Static = require("jack").Static;
var notFound = require("./geoexplorer/util").notFound;

var root = FILE.join(FILE.dirname(module.path), "../client");

var app = URLMap({
    
    "/": Static(notFound, {root: root, urls: [""], indexes: ["index.html"]}),
    
    "/maps/": require("./geoexplorer/maps").app,
    
    "/proxy/": require("./proxy").app
    
});


exports.app = app;
