import Twilio from 'twilio';
import { ElevenLabsClient } from "elevenlabs";
import { createClient as createClientDeepgram } from "@deepgram/sdk";
import { insertCall, getAllCalls } from '../../models/v1/CallsModel.mjs';
import constants from '../../../utils/constants.mjs';
import { getDomainName } from '../../../utils/dataConversions.mjs';

const sendSms = async (phoneNumber, text) => {
    let response = {};
    const twilio = new Twilio(constants.ACCOUNT_SID_TWILIO, constants.AUTH_TOKEN_TWILIO);
    const message = await twilio.messages.create({
        body: text,
        from: PHONE_NUMBER_TWILIO,
        to: phoneNumber,
    })
    .then()
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

export const generateVoiceTTS = async (text_id) => {
    const elevenlabs = new ElevenLabsClient({ apiKey: constants.AUTH_TOKEN_11LABS });
    const text = text_id == "1" ? constants.INITIAL_TEXT_MESSAGE :
    text_id == "2" ? constants.UNANSWERED_CALL_TEXT_MESSAGE :
    "";

    return await elevenlabs.textToSpeech.convert(constants.VOICE_ID_11LABS, {
        model_id: 'eleven_flash_v2_5',
        output_format: constants.OUTPUT_FORMAT_11LABS,
        text,
    });
}

const transcribeVoiceSTT = async (audio_url) => {
    const deepgram = createClientDeepgram(constants.AUTH_TOKEN_DEEPGRAM);
    const { result, err } = await deepgram.listen.prerecorded.transcribeUrl(
        {
            url: audio_url,
        },
        {
            model: "nova-3",
            smart_format: true,
        }
    );

    if (err) {
        err.isOperational = true;
        throw err;
    }

    return result.channels[0].alternatives[0].transcript;
}

export const leaveVoiceMail = async (callSid, answeredBy) => {
    console.log("leaveVoiceMail", answeredBy);
    if (!["machine_end_beep", "machine_end_silence", "machine_end_other"].includes(answeredBy)) {
        return {
            "status": true,
            "message": "Machine didn't respond."
        }
    }

    const twilio = new Twilio(constants.ACCOUNT_SID_TWILIO, constants.AUTH_TOKEN_TWILIO);
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
    .then()
    .catch((err) => {
        err.isOperational = true;
        throw err;
    });

    let response = {
        "status": "Voicemail left",
        "sid": call.sid
    };

    await insertCall(response);

    return {
        "status": true,
        "message": "Machine did respond and voice mail was leaved."
    }
}

export const triggerVoiceCall = async (phoneNumber) => {
    let response = {};
    const twilio = new Twilio(constants.ACCOUNT_SID_TWILIO, constants.AUTH_TOKEN_TWILIO);
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
            // statusCallback: constants.SERVER_DOMAIN + '/api/v1/calls/status',
            recordingStatusCallback: constants.SERVER_DOMAIN + '/api/v1/calls/status',
            asyncAmd: true,
            asyncAmdStatusCallback: constants.SERVER_DOMAIN + '/api/v1/calls/voiceMail',
            asyncAmdStatusCallbackMethod: "POST"
        }
    )
    .then()
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

export const changeStatusVoiceCall = async (callInfo) => {
    let transcribedPatientText = "";
    const twilio = new Twilio(constants.ACCOUNT_SID_TWILIO, constants.AUTH_TOKEN_TWILIO);
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
        .then()
        .catch((err) => {
            err.isOperational = true;
            throw err;
        });

        console.log(callRecordings);
        if( callRecordings.length > 0 ){
            const callRecordingID = callRecordings[0].sid;
            const callRecordingURL = 
            `https://api.twilio.com/2010-04-01/Accounts/${constants.ACCOUNT_SID_TWILIO}/Recordings/${callRecordingID}.mp3`;
            response['callRecordingURL'] = callRecordingURL;
            transcribedPatientText = await transcribeVoiceSTT(callRecordingURL);
        }

        response['status'] = "answered";

    } else {
        if ( callInfo.status == "no-answer") {
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

export const getAllVoiceCalls = async () => {
 return await getAllCalls();
}