var File = require("file");

var parser = new (require("args").Parser)();

parser.usage(' [jackup config]');
parser.help('Runs the Jackup tool to start a JSGI compatible application using a Jack handler.');

parser.option("-e", "--eval", "code")
    .help("evaluate a LINE of code to be used as the app (overrides module)")
    .set();
    
parser.option("-I", "--include", "lib")
    .help("add a library path to loader in the position of highest precedence")
    .action(function() { print("WARNING: -I --include not implemented"); });
    
parser.option("-a", "--app", "app")
    .help("name of the module property to use as the app (default: app)")
    .def("app")
    .set();
    
parser.option("-s", "--server", "server")
    .help("serve using SERVER")
    .set();
    
parser.option("-o", "--host", "host")
    .help("listen on HOST (default: 0.0.0.0)")
    .def("0.0.0.0")
    .set();
    
parser.option("-p", "--port", "port")
    .help("use PORT (default: 8080)")
    .def(8080)
    .natural();
    
parser.option("-E", "--env", "environment")
    .help("use ENVIRONMENT: deployment, development (default), none")
    .def("development")
    .set();
    
parser.option("-r", "--reload", "reload")
    .help("reload application on each request")
    .set(true);
    
parser.option("-V", "--version")
    .help("print Jackup version number and exit.")
    .action(function () {
        this.print("Jackup Version 0.2");
        this.exit();
    });
    
parser.option("-h", "--help")
    .action(parser.printHelp);

exports.main = function main(args) {
    var options = parser.parse(args);
    
    if (options.args.length > 1) {
        parser.printHelp(options);
        parser.exit(options);
    }
    
    var config = options.args[0];

    var app, configModule;
    
    if (!options.code) {
        if (!config)
            config = "jackconfig";

        if (config.charAt(0) !== "/")
            config = File.join(File.cwd(), config);

        print("Loading configuration module at " + config);

        system.args[0] = config;
        
        configModule = require(config);
        if (!configModule)
            throw new Error("configuration " + config + " not found");
            
        if (options.reload)    
            app = require("jack/reloader").Reloader(config, options.app);
        else
            app = configModule[options.app];
    }
    else
        app = system.evalGlobal(options.code);
    
    if (typeof app !== "function")
        throw new Error("JSGI application must be a function, is: " + app);
    
    if (configModule && typeof configModule[options.environment] === "function")
    {
        app = configModule[options.environment](app);
    }
    else
    {
        switch (options.environment) {
            case "development" :
                app = require("jack/commonlogger").CommonLogger(
                        require("jack/showexceptions").ShowExceptions(
                            require("jack/lint").Lint(app)));
                break;
            case "deployment" :
                app = require("jack/commonlogger").CommonLogger(app);
                break;
            case "none" :
                //app = app;
                break;
            default :
                throw new Error("Unknown environment (development, deployment, none)");
        }
    }
    
    if (typeof app !== "function")
        throw new Error("JSGI application must be a function, is: " + app);
    
    var server = options.server || exports.detectHandler();

    // Load the required handler.
    var handler = null;
    try {
        handler = require("jack/handler/" + server);
    } catch (e) {
        throw new Error("Jack handler \""+server+"\" not found");
    }
    
    if (handler && typeof handler.run !== "function")
        throw new Error("Jack handler must be a function, is: " + handler.run);
    
    handler.run(app, options);
};

exports.detectHandler = function() {
    var server = null;
    
    if (system.env["PHP_FCGI_CHILDREN"] !== undefined)
        server = "fastcgi";
    else if (system.engine === "rhino")
        server = "simple";
    else if (system.engine === "k7")
        server = "shttpd";
    else if (system.engine === "v8cgi")
        server = "v8cgi";
    else if (system.engine === "xulrunner")
        server = "mozhttpd";
    else if (system.engine === "jsc")
        server = "jill";
    else
        throw new Error("Unknown engine " + system.engine + ". Specify a server with the \"-s\" option.");
    
    return server;
};

if (module.id == require.main)
    exports.main(system.args);

