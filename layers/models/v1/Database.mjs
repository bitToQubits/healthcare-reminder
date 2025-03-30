import MongoClient from "mongodb";

/* Courtesy of GeeksforGeeks */

const url = 'mongodb://localhost:27017'; 
const databaseName = 'healthcare-reminder';

let mongoClientInstance = null;

let maxPoolSize = 10;

const connectionOption = {
    maxPoolSize: maxPoolSize
}

async function connectToDb() {
    if ( ! mongoClientInstance ) {
        mongoClientInstance = await MongoClient.connect(url, connectionOption);
    }

    return mongoClientInstance.db(databaseName);
}

module.exports = { connectToDb };