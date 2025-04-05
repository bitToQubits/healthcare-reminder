import { connectToDb } from "./Database.mjs";

// All errors related to the data layer are non operational because they can lead to data loss or corruption.
// Systems needs to fail in purpose.

/**
 * Insert call to the mongoDB database
 * @category CallsModel
 * @author jlbciriaco[at]gmail.com
 * @param  {Object} callInfo    The object with the properties required on the technical requirements.
 */
export const insertCall = async (callInfo) => {
    let dbo = await connectToDb();
    let queryFilter = { sid: callInfo.sid };
    
    const callWithTheSameSid = await dbo.collection("calls").findOne(queryFilter).catch(
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
        queryFilter = { ...queryFilter, status: {$not: {$eq: "Voicemail left"}} }
        dbo.collection("calls").updateOne(queryFilter, newCallValues, function(err, res) {
            if (err) {
                err.isOperational = false;
                throw err;
            }
        });
    }

}

/**
 * Get all saved calls from the mongoDB database
 * @category CallsModel
 * @author jlbciriaco[at]gmail.com
 * @return  {Array} Array of objects with the calls info.
 */
export const getAllCalls = async () => {
    let dbo = await connectToDb();
    
    // Non critical endpoint, so error is operational.
    let results = await dbo.collection("calls").find({}).toArray(function(err, result) {
        if (err) {
            err.isOperational = true;
            throw err;
        }
        return result;
    });

    return results;
};