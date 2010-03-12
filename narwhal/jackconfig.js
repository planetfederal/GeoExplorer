var URLMap = require("jack").URLMap;

exports.app = require("geoexplorer").app;

exports.development = function(app) {
    
    return require("jack/contentlength").ContentLength(
        URLMap({
            "/": app,
            "/geoexplorer/script/": require("autoloader").App("../../build/jsbuild.cfg")
        })
    );

};

//var Request = require("jack/request").Request;
//var HttpClient = require("http-client").HttpClient;
//
//exports.app = function(env) {
//    
//    var client = new HttpClient({
//        url: "http://demo.opengeo.org/geoserver/wms?request=GetCapabilities"
//    });
//    return HttpClient.decode(client.connect());    
//    
//};