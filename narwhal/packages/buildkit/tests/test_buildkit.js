exports["test: merge"] = require("./buildkit/test_merge");

if (require.main == module) {
    require("test/runner").run(exports);
}

