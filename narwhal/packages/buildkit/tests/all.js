exports["test: buildkit"] = require("./test_buildkit");

if (require.main == module) {
    require("test/runner").run(exports);
}

