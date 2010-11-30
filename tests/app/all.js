exports["test: maps"] = require("./maps_test");

if (require.main == module || require.main == module.id) {
    require("test").run(exports);
}
