exports["test: app"] = require("./app/all");

if (require.main == module || require.main == module.id) {
    require("test").run(exports);
}
