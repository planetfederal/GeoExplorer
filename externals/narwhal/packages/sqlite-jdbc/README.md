JDBC/SQLite for CommonJS
========================

A minimal wrapper for JDBC/SQLite in Rhino / Narwhal.

API:
----

Open a SQLite database on disk:

    open: function(path) -> java.sql.Connection

Open a SQLite database in memory:

    memory: function() -> java.sql.Connection

More information:

* https://developer.mozilla.org/en/Scripting_Java
* http://java.sun.com/j2se/1.4.2/docs/api/java/sql/Connection.html
