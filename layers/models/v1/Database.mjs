import MongoClient from "mongodb";
import dotenv from 'dotenv';
dotenv.config();

const IP_ADDRESS = process.env.IP_ADDRESS_MONGODB || 'localhost';
const PORT = process.env.PORT_MONGODB || '27017';

/* Courtesy of GeeksforGeeks */

const url = `mongodb://${IP_ADDRESS}:${PORT}`; 
const databaseName = 'healthcare-reminder';

let mongoClientInstance = null;

let maxPoolSize = 10;

const connectionOption = {
    maxPoolSize: maxPoolSize
}

export const connectToDb = async () => {
    if ( ! mongoClientInstance ) {
        mongoClientInstance = await MongoClient.connect(url, connectionOption);
    }

    return mongoClientInstance.db(databaseName);
}