import { connectToDb } from "./Database.mjs";

export const insertCall = async (callInfo) => {
    let dbo = await connectToDb();
    let queryFilter = { sid: callInfo.sid };
    
    dbo.collection("calls").find(queryFilter).toArray(function(err, result) {
        if (err) {
            err.isOperational = true;
            throw err;
        }

        if(result.length == 0){
            dbo.collection('calls').insertOne(call_info, (err, res) => {
                if (err) {
                    err.isOperational = true;
                    throw err;
                }
            })
        } else {
            let newCallValues = { $set: callInfo };
            dbo.collection("customers").updateOne(queryFilter, newCallValues, function(err, res) {
                if (err) {
                    err.isOperational = true;
                    throw err;
                }
            });
        }

    })
};

export const getAllCalls = async () => {
    let dbo = await connectToDb();
    let results = await dbo.collection("customers").find({}).toArray(function(err, result) {
        if (err) {
            err.isOperational = true;
            throw err;
        }
        return result;
    });

    return results;
};