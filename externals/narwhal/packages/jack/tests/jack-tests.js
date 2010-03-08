exports.testJack = require("./jack/all-tests");

if (require.main === module.id)
    require("test/runner").run(exports);
