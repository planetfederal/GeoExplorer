var FILE = require("file");
var MERGE = require("./merge");
var CONFIG = require("./config");

var parser = new (require("args").Parser)();

parser.help("Builds concatenated and minified scripts from a JavaScript library.");

parser.option("-l", "--list", "list")
    .help("list files to be included in a build")
    .set(true);

parser.arg("config");

parser.helpful();

exports.main = function main(args) {
    
    var options = parser.parse(args);
    
    if (options.args.length < 1) {
        parser.printHelp(options);
        parser.exit(options);
    }
    
    var config = options.args[0];
    if (!FILE.isFile(config)) {
        parser.error(options, "Can't find config file: " + config);
    }
    
    var sections = CONFIG.parse(config);
        
    if (options.list) {
        print();
        var group, separator, ordered;
        for (var section in sections) {
            print(section);
            print(section.replace(/./g, "-"));
            group = sections[section];
            group.root = [FILE.join(FILE.dirname(config), group.root[0])];
            ordered = MERGE.order(group);
            print(ordered.join("\n"));
            print();
        }
    }
    
};


if (module.id == require.main) {
    exports.main(system.args);
}
