// Install body-parser and Express
const express = require('express')
const app = express()
const fs = require('fs')
const cheerio = require('cheerio')
const Authenticator = require('./authentication/authentication').Authenticator;
const APIHandler = require('./api/apihandler').APIHandler;
const AppResolver = require('./api/appresolver').AppResolver;

const DatabaseHelper = require('./helpers/mongo');
const MongoHelper = new DatabaseHelper.mongo();
if(process.env.NODE_ENV == "test") { 
    global.MongoTests = MongoHelper;
}
const subdomain = require('express-subdomain');

var bodyParser = require('body-parser')

const authServer = new Authenticator(MongoHelper)
const apiServer = new APIHandler(MongoHelper, authServer)
const arServer = new AppResolver(MongoHelper, authServer)

// Use req.query to read values!!
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(subdomain("api.go", apiServer.getRoutes()))
app.use(subdomain("auth.go", authServer.getRoutes()))
app.use(subdomain("*.go", arServer.getRoutes()))

// app.get('/', (req, res) => res.json('Hello World!'))

if(process.env.NODE_ENV != "test") {
    app.listen(8080, () => console.log('PrauxyGO backend started'))
} else {
    module.exports.app = app;
    module.exports.authServer = authServer;
    module.exports.apiServer = apiServer,
    module.exports.arServer = arServer;
}