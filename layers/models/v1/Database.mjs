import MongoClient from "mongodb";
import constants from '../../../utils/constants.mjs';

/* Courtesy of GeeksforGeeks */

const url = `mongodb://${constants.DB_IP_ADDRESS}:${constants.DB_PORT}`; 
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