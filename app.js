var express = require("express"),
    mysql = require("db-mysql"),
    generic_pool = require("generic-pool"),
    uuid = require("node-uuid");
require("express-resource");

/* MySQL pool */
var config = require("./config.json");
var pool = generic_pool.Pool({
    name: 'mysql',
    max: 10,
    create: function(callback) {
        new mysql.Database({
            hostname: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        }).connect(function(err,server) {
            callback(err, this);
        });
    },
    destroy: function(db) {
        db.disconnect();
    }
});

var app = express();

app.configure(function() {
    app.use(express.bodyParser());
});

var info = require("./package.json");
app.get('/', function(req, res) {
    res.send(info.name + " - " + info.version);
});

var User = {
    create: function(req, res) {
        if (req.body.user && req.body.pass) {
            if (!req.body.email) req.body.email = null;
            pool.acquire(function(err, db) {
                if (err) {
                    res.statusCode = 500;
                    console.log(err);
                    return res.end("Internal Server Error: Database error\n");
                }
                db.query().select("*").from("users").where("user = ?", [req.body.user]).execute(function(err, rows, columns) {
                    if (err) {
                        pool.release(db);
                        console.log(err);
                        res.statusCode = 500;
                        return res.end("Internal Server Error: Database error\n");
                    }
                    if (rows.length) {
                        pool.release(db);
                        res.statusCode = 409;
                        return res.end("Conflict: Username already exists.\n");
                    }
                    console.log(db.query().insert("users",
                        ["user", "pass", "email"], [req.body.user, req.body.pass, req.body.email]).sql());
                    db.query().insert("users",
                        ["user", "pass", "email"], [req.body.user, req.body.pass, req.body.email]).execute(function(err, result) {
                        pool.release(db);
                        if (err) {
                            res.statusCode = 500;
                            console.log(err);
                            return res.end("Internal Server Error: Database error\n");
                        }
                        res.statusCode = 201;
                        return res.end("/users/" + req.body.user + "\n");
                    });
                });
            });
        } else {
            res.statusCode = 400;
            return res.end("Bad Request: provide user and pass in POST request.\n");
        }
    },
    update: function(req, res) {
        res.statusCode = 501;
        res.end("Not yet implemented.\n");
    },
    delete: function(req, res) {
        res.statusCode = 501;
        res.end("Not yet implemented.\n");
    }
};

var tokens = Object.create(null);
var Token = {
    create: function(req, res) {
        // TODO Real validation
        if (req.body.user && req.body.pass) {
            pool.acquire(function(err, db) {
                if (err) {
                    res.statusCode = 500;
                    return res.end("Internal Server Error: Database error.\n");
                }
                db.query().select("*").from("users").where("user = ? and pass = ?", [req.body.user, req.body.pass]).execute(function(error, rows, column) {
                    pool.release(db);
                    if (error) {
                        res.statusCode = 500;
                        return res.end("Internal Server Error: Database error.\n");
                    }
                    if (rows.length == 0) {
                        res.statusCode = 403;
                        return res.end("Forbidden: Please supply valid credentials when requesting token.\n");
                    }
                    var token = uuid.v4();
                    tokens[token] = {expires: Date.now() + 1000 * 60 * 30, user: req.body.user};
                    res.statusCode = 201;
                    return res.end("/tokens/" + token + "\n");
                });
            });
        } else {
            res.statusCode = 400;
            return res.end("Bad Request: provide existing user and pass in POST request\n");
        }
    },
    load: function(req, id, next) {
        next(null, tokens[id]);
    }
};

var Team = {
    index: function(req, res) {
        console.log("Team index");
        console.log("Token: " + req.token);
        res.end("\n");
    },
    create: function(req, res) {

    },
    show: function(req, res) {

    },
    update: function(req, res) {

    },
    destroy: function(req, res) {

    }
};

app.resource('users', User);
app.resource('tokens', Token, {load: Token.load}).add(app.resource('teams', Team));

app.listen(3000)
