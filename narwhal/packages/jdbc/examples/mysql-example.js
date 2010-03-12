var JDBC = require("jdbc");

var conn = JDBC.connect("jdbc:mysql://localhost:3306/foo?user=root&password=");

var stat = conn.createStatement();

stat.executeUpdate("drop table if exists people;");
stat.executeUpdate("create table people (name VARCHAR(255), occupation VARCHAR(255));");

var prep = conn.prepareStatement("insert into people values (?, ?);");

prep.setString(1, "Gandhi");
prep.setString(2, "politics");
prep.addBatch();
prep.setString(1, "Turing");
prep.setString(2, "computers");
prep.addBatch();
prep.setString(1, "Wittgenstein");
prep.setString(2, "smartypants");
prep.addBatch();

conn.setAutoCommit(false);
prep.executeBatch();
conn.setAutoCommit(true);

var rs = stat.executeQuery("select * from people;");
while (rs.next()) {
    print("name = " + rs.getString("name"));
    print("job = " + rs.getString("occupation"));
}

rs.close();
conn.close();
