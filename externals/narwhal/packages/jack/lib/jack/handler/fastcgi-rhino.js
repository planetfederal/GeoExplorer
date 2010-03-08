exports.run = function(app, options) {
    throw "NYI";
    
    var options = options || {};
    //java.lang.System.setProperties("FCGI_PORT", options["port"] || 8080);
    while (true)
    {
        var result = new Packages.com.fastcgi.FCGIInterface().FCGIaccept()
        if (result < 0)
            break;
        
        serve(Packages.com.fastcgi.FCGIInterface.request, app);
    }
}

var serve = function(request, app) {
    print("Serving FastCGI request (if it were implememted...)");
    //var env = {
    //    "jsgi.input" : request.input,
    //    "jsgi.errors" : request.err,
    //    
    //    "jsgi.multithread" : false,
    //    "jsgi.multiprocess" : true,
    //    "jsgi.run_once" : false,
    // };
}
