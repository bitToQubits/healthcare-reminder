import { connectToDb } from "./Database.mjs";

// All errors related to the data layer are non operational because they can lead to data loss or corruption.
// Systems needs to fail in purpose.

export const insertCall = async (callInfo) => {
    let dbo = await connectToDb();
    let queryFilter = { sid: callInfo.sid };
    
    const callWithTheSameSid = await dbo.collection("calls").findOne(queryFilter).then().catch(
        (err) => {
            err.isOperational = false;
            throw err;
        }
    );
    
    if(!callWithTheSameSid){
        dbo.collection('calls').insertOne(callInfo, (err, res) => {
            if (err) {
                err.isOperational = false;
                throw err;
            }
        });
    } else {
        let newCallValues = { $set: callInfo };
        dbo.collection("calls").updateOne(queryFilter, newCallValues, function(err, res) {
            if (err) {
                err.isOperational = false;
                throw err;
            }
        });
    }

}

export const getAllCalls = async () => {
    let dbo = await connectToDb();
    
    // lets make an exception for this endpoint, is non critical.
    let results = await dbo.collection("calls").find({}).toArray(function(err, result) {
        if (err) {
            err.isOperational = true;
            throw err;
        }
        return result;
    });

    return results;
};