const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const cors = require('cors');
const CONNECTION_URL = "mongodb+srv://root:pass@sandbox.e8wbs.mongodb.net/test";
const DATABASE_NAME = "user_accounts";
const CryptoJS = require("crypto-js");

var app = Express();
app.use(cors());
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "localhost:3000"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(5000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("accounts");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.post('/usernameCheck', function(request, response, next) {
    const query = { username: request.body["username"] };
    collection.findOne(query, {}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        return response.send(result === null);
    });
});

app.post('/register', function(request, response, next) {
    if(!request.body["username"] || !request.body["password"]) { return response.send(false); }
    // Encrypt Password //
    // https://www.npmjs.com/package/crypto-js //
    let password = CryptoJS.AES.encrypt(request.body["password"], "asomewhatsecretkey").toString();
    let body = request.body;
    body["password"] = password;
    collection.insertOne(body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        return response.send(result.ops[0]);
    });
});

app.post('/login', function(request, response, next) {
    if(!request.body["username"] || !request.body["password"]) { return response.send(false); }
    // Find the account //
    collection.findOne({username: request.body["username"]}, {}, (error, result) => {
        if(error) {
            return response.send(false);
        }
        if(result !== null) {
            // Check the password //
            // https://www.npmjs.com/package/crypto-js //
            var bytes  = CryptoJS.AES.decrypt(result.password, "asomewhatsecretkey");
            if(bytes.toString(CryptoJS.enc.Utf8) === request.body["password"]) {
                return response.send(result);
            } else {
                return response.send(false);
            }
        } else {
            return response.send(false);
        }
    });
});