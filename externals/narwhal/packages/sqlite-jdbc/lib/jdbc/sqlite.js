var jdbc = require("jdbc");

exports.open = function(path) {
    return jdbc.connect("jdbc:sqlite:"+path);
}

exports.memory = function() {
    return jdbc.connect("jdbc:sqlite::memory:")
}
