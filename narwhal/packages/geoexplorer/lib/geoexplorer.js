var FILE = require("file");
var URLMap = require("jack").URLMap;
var Static = require("jack").Static;
var notFound = require("./geoexplorer/util").notFound;

var root = FILE.join(FILE.dirname(module.path), "../client");

var app = URLMap({
    
    "/geoexplorer/": Static(notFound, {root: root, urls: [""], indexes: ["index.html"]}),
    
    "/geoexplorer/map/": require("./geoexplorer/map").handler,
    
    "/proxy/": require("./proxy").app
    
});


exports.app = app;
