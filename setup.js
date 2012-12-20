var mysql = require("db-mysql");
var config = require("./config.json");

new mysql.Database({
    hostname: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
}).connect(function(err,server) {
    if (err !== null) {
        console.log("Error: Cannot connect to database. Supply credentials in config.json");
    }
    this.query("CREATE TABLE users (user VARCHAR(20) NOT NULL, email VARCHAR(60), pass VARCHAR(256) NOT NULL, PRIMARY KEY(user))").execute(function(err, results) {
        if (err) {
            console.log("Error: " + err);
        }
        if (results) {
            console.log("Success, all tables have been created.");
        }
    }); 
});

