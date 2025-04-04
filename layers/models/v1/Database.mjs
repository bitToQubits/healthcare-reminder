import { MongoClient, ServerApiVersion } from "mongodb";
import constants from '../../../utils/constants.mjs';

const databaseName = 'healthcare-reminder';

let mongoClientInstance = null;

const client = new MongoClient(constants.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export const connectToDb = async () => {
    if ( ! mongoClientInstance ) {
        mongoClientInstance = await client.connect().catch((err) => {
            if(err) {
                err.isOperational = false;
                throw err;
            }
        });
    }

    return await mongoClientInstance.db(databaseName);
}