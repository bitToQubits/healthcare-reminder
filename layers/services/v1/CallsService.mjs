import Twilio from 'twilio';
import { ElevenLabsClient } from "elevenlabs";
import { createClient as createClientDeepgram } from "@deepgram/sdk";
import { insertCall, getAllCalls } from '../../models/v1/CallsModel.mjs';
import { getDomainName } from '../../../utils/dataConversions.mjs';
import constants from '../../../utils/constants.mjs';
import fetch from 'node-fetch';

const twilio = new Twilio(constants.ACCOUNT_SID_TWILIO, constants.AUTH_TOKEN_TWILIO);

/**
 * Send sms using Twilio API.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @param  {Number} phoneNumber     The from phone number to send the sms.
 * @param  {String} text            Text to send 
 * @return {Object}                 Status for the sms.
 */
const sendSms = async (phoneNumber, text) => {
    let response = {};
    const message = await twilio.messages.create({
        body: text,
        from: constants.PHONE_NUMBER_TWILIO,
        to: phoneNumber,
    })
    .catch((err) => {
        err.isOperational = true;
        throw err;
    });

    if (message.body.sid) {
        response = {
            "status": true,
            "message": "SMS sent."
        }
    } else {
        response = {
            "status": false,
            "message": message.body.errorMessage,
            "errorCode": message.body.errorCode,
        }
    }

    return response;
}

/**
 * Generate voice using ElevenLabs API.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @param  {Number} textId         The ID of the text that we want to generate    
 * @return {Promise}                Promise resolving in a buffer with the audio in the output format.
 */
export const generateVoiceTTS = async (textId, stream = false) => {
    const elevenlabs = new ElevenLabsClient({ apiKey: constants.AUTH_TOKEN_11LABS });
    const text = 
    textId == "1" ? constants.INITIAL_TEXT_MESSAGE :
    textId == "2" ? constants.UNANSWERED_CALL_TEXT_MESSAGE :
    "";

    if(!stream){
        return await elevenlabs.textToSpeech.convert(constants.VOICE_ID_11LABS, {
            model_id: 'eleven_flash_v2_5',
            output_format: constants.OUTPUT_FORMAT_11LABS,
            text,
        });
    } else {
        return await client.textToSpeech.convertAsStream(constants.VOICE_ID_11LABS, {
            model_id: 'eleven_flash_v2_5',
            output_format: constants.OUTPUT_FORMAT_11LABS,
            text,
        });
    }

}

/**
 * Transcribe speech to text using Deepgram API.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @param  {Buffer} bufferRecordingData Buffer containing the binary contents of the audio/mp3 to be transcribed.
 * @return {String}                     Transcribed text
 */
const transcribeVoiceSTT = async (bufferRecordingData) => {
    const deepgram = createClientDeepgram(constants.AUTH_TOKEN_DEEPGRAM);
    const { result, err } = await deepgram.listen.prerecorded.transcribeFile(
        bufferRecordingData,
        {
            model: "nova-3",
            smart_format: true,
        }
    );

    if (err) {
        err.isOperational = true;
        throw err;
    }

    return result?.results?.channels[0]?.alternatives[0]?.transcript;
}

/**
 * Leave voice mail using Twilio API.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @param  {String} callSid     The unique identifier for the twilio call.
 * @param  {String} answeredBy  The result of the Twilio algorithm that checks whether the machine answered the call.
 * @return {Object}             Status of the voice mail   
 */
export const leaveVoiceMail = async (callSid, answeredBy) => {
    if (!["machine_end_beep", "machine_end_silence", "machine_end_other"].includes(answeredBy)) {
        return {
            "status": true,
            "message": "Machine didn't respond."
        }
    }

    let twiml = new Twilio.twiml.VoiceResponse();
    let connect = twiml.connect();
    connect.stream({
        name: 'unansweredCallAudioMessage',
        url: `wss://${getDomainName(constants.SERVER_DOMAIN)}/api/v1/calls/audiostream/2`,
    });
    twiml.hangup();
    twiml = twiml.toString();

    const call = await twilio.calls(callSid).update(
        {
            twiml
        }
    )
    .catch((err) => {
        err.isOperational = true;
        throw err;
    });

    let response = {
        "status": "Voicemail left",
        "sid": call.sid
    };

    console.log(response);

    await insertCall(response);

    return {
        "status": true,
        "message": "Machine did respond and voice mail was leaved."
    }
}

/**
 * Create an outbound voice call using Twilio API.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @param  {Number} phoneNumber Recipient phone number
 * @return {Object}             Status of the outbound voice call. Should be queued.   
 */
export const triggerVoiceCall = async (phoneNumber) => {
    let response = {};
    let twiml = new Twilio.twiml.VoiceResponse();
    let connect = twiml.connect();
    connect.stream({
        name: 'initialAudioMessage',
        url: `wss://${getDomainName(constants.SERVER_DOMAIN)}/api/v1/calls/audiostream/1`,
    });
    twiml.record();
    twiml.hangup();
    twiml = twiml.toString();

    const call = await twilio.calls.create(
        {
            from: constants.PHONE_NUMBER_TWILIO,
            to: phoneNumber,
            twiml,
            machineDetection: "DetectMessageEnd",
            statusCallback: constants.SERVER_DOMAIN + '/api/v1/calls/status',
            asyncAmd: true,
            asyncAmdStatusCallback: constants.SERVER_DOMAIN + '/api/v1/calls/voiceMail',
            asyncAmdStatusCallbackMethod: "POST",
        }
    )
    .catch((err) => {
        err.isOperational = true;
        throw err;
    });

    response = {
        "status": call.status,
        "sid": call.sid
    };

    await insertCall(response);

    console.log(response);
    return response;
}

/**
 * Callback which Twilio programmatically uses to change the status of voice calls.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @param  {Object} callInfo    The call resource. Get more info at https://static1.twilio.com/docs/voice/api/call-resource 
 * @return {Object}             New status of the call.
 */
export const changeStatusVoiceCall = async (callInfo) => {
    let transcribedPatientText = "";
    let response = {
        "status": callInfo.CallStatus,
        "sid": callInfo.CallSid
    }

    if( callInfo.CallStatus == "completed" ){
        const callRecordings = await twilio.recordings.list(
            {
                callSid: callInfo.CallSid, 
                limit: 20
            }
        )
        .catch((err) => {
            err.isOperational = true;
            throw err;
        });

        if( callRecordings.length > 0 ){
            const callRecordingID = callRecordings[0].sid;
            const callRecordingURL = 
            `https://api.twilio.com/2010-04-01/Accounts/${constants.ACCOUNT_SID_TWILIO}/Recordings/${callRecordingID}.mp3`;

            const stringAuth = 
            'Basic '+ Buffer.from(constants.ACCOUNT_SID_TWILIO + ':' + constants.AUTH_TOKEN_TWILIO).toString('base64');
            const responseRecordingTwilio = await fetch(callRecordingURL, {headers: {Authorization: stringAuth}});

            let bufferRecordingData = await responseRecordingTwilio.arrayBuffer();
            bufferRecordingData = Buffer.from(bufferRecordingData);

            response['callRecordingURL'] = callRecordingURL;
            transcribedPatientText = await transcribeVoiceSTT(bufferRecordingData);
        }

        response['status'] = "answered";

    } else {
        if (["no-answer", "failed"].includes(callInfo.CallStatus)) {
            const smsInfo = await sendSms(callInfo.Called, constants.UNANSWERED_CALL_TEXT_MESSAGE);
            if( smsInfo.status ){
                response['status'] = "SMS sent";
            }
        }
    }

    response['patientResponse'] = transcribedPatientText;

    await insertCall(response);

    console.log(response);
    return response;
};

/**
 * Callback which Twilio programmatically uses to get the TwiML required for incoming voice calls.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @return {Object} New status of the call.
 */
export const receiveVoiceCall = async () => {
    let twiml = new Twilio.twiml.VoiceResponse();
    let connect = twiml.connect();
    connect.stream({
        name: 'initialAudioMessage',
        url: `wss://${getDomainName(constants.SERVER_DOMAIN)}/api/v1/calls/audiostream/1`,
    });
    twiml.record();
    twiml.hangup();
    return twiml.toString();
}

/**
 * Get all voice calls saved by the system.
 * @category CallsService
 * @author jlbciriaco[at]gmail.com
 * @return {Promise} Promise resolving to an array of objects with the voice calls info.
 */
export const getAllVoiceCalls = async () => {
 return await getAllCalls();
}