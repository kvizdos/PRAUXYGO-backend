const mongo = require("mongodb").MongoClient;
const { MongoMemoryServer } = require('mongodb-memory-server');

class mongodbHelper {
    constructor() {
        console.log(process.env.NODE_ENV)

        if(process.env.NODE_ENV != "test") {
            const url = "mongodb://localhost:27017/";

            console.log("URL: " + url);

            mongo.connect(url).then(client => {
                console.log("Connected to " + url)
                const db = client.db("prauxygo");
                this.db = db;
            })
        } else {
            this.server = new MongoMemoryServer();
        }
    }

    async setupTestEnvironment() {
        const url = await this.server.getConnectionString();
        const client = await mongo.connect(await url);
        this.db = client.db(await this.server.getDbName());    
    }

    async find(collection, query, projection = { '_id': 0 }) {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).find(query).project(projection).toArray((err, res) => {
                if(err) reject(error);
                resolve(res);
            })
        });
    }

    async insert(collection, item) {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).insertOne(item, (err, res) => {
                if(err) reject(error);
                resolve(res);
            })
        })
    }

    async update(collection, query, item) {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).updateOne(query, item, (err, res) => {
                if(err) reject(err);

                resolve(res);
            })
        })
    }
}

module.exports.mongo = mongodbHelper;