var FILE = require("file");
var MERGE = require("./merge");
var CONFIG = require("./config");
var JSMIN = require("./jsmin");

var parser = new (require("args").Parser)();

parser.help("Builds concatenated and minified scripts from a JavaScript library.");

parser.option("-l", "--list", "list")
    .help("list files to be included in a build")
    .set(true);

parser.option("-o", "--outdir", "outdir")
    .help("output directory for scripts")
    .set();

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
        
    var group, separator, ordered, concat, oufile;
    for (var section in sections) {
        group = sections[section];
        group.root = [FILE.join(FILE.dirname(config), group.root[0])];
        if (options.list) {
            ordered = MERGE.order(group);
            print(section);
            print(section.replace(/./g, "-"));
            print(ordered.join("\n"));
            print();
        } else {
            concat = MERGE.concat(group);
            concat = JSMIN.jsmin(concat);
            outfile = section;
            if (options.outdir) {
                outfile = FILE.join(options.outdir, outfile);
            }
            FILE.write(outfile, concat);
        }
    }
    
};


if (module.id == require.main) {
    exports.main(system.args);
}
