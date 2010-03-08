exports.connect = function(url, options) {
    var info = new Packages.java.util.Properties();

    for (var key in options)
        info.setProperty(key, String(options[key]));

    var driver = getDriver(url);

    var conn = driver.connect(url, info);

    return conn;
}

exports.DRIVERS = [
    Packages.org.sqlite.JDBC,
    Packages.com.mysql.jdbc.Driver
];

function getDriver(url) {
    for (var i = 0; i < exports.DRIVERS.length; i++) {
        try {
            var driver = new exports.DRIVERS[i]();
            if (driver.acceptsURL(url))
                return driver;
        } catch (e){
        }
    }
    return null;
}
