JDBC for CommonJS
=================

A minimal wrapper for JDBC in Rhino / Narwhal.

API
---

Open a MySQL database:

    connect: function(connectionString, options) -> java.sql.Connection

More information:

* https://developer.mozilla.org/en/Scripting_Java
* http://java.sun.com/j2se/1.4.2/docs/api/java/sql/Connection.html

Examples
--------

    var JDBC = require("jdbc");

    // MySQL:
    JDBC.connect("jdbc:mysql://localhost/bd?user=user&password=password");

    // SQLite:
    JDBC.connect("jdbc:sqlite::memory:");

TODO
----

* Actually wrap JDBC objects and perform translations between JavaScript and Java objects.
