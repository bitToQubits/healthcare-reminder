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
        to: phoneNumber
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
    if (!["machine_end_beep", "machine_end_silence", "machine_end_other"].includes(answeredBy)) {
        return {
            "status": true,
            "message": "Machine didn't respond."
        }
    }

    const twilio = new Twilio(constants.ACCOUNT_SID_TWILIO, constants.AUTH_TOKEN_TWILIO);
    let twiml = new Twilio.twiml.VoiceResponse();
    const start = twiml.start();
    start.stream({
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

    console.log(response);
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
    let transcribedPatientText = "";
    const start = twiml.start();
    start.stream({
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
            AsyncAmdStatusCallback: constants.SERVER_DOMAIN + '/api/v1/sendVoiceMail'
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

    if( call.status == "completed" ){
        const callRecordings = await twilio.recordings.list(
            {
                callSid: call.sid, 
                limit: 1
            }
        )
        .then()
        .catch((err) => {
            err.isOperational = true;
            throw err;
        });

        if( callRecordings.length > 0 ){
            const callRecordingID = callRecordings[0].sid;
            const callRecordingURL = 
            `https://api.twilio.com/2010-04-01/Accounts/${constants.ACCOUNT_SID_TWILIO}/Recordings/${callRecordingID}.mp3`;
            response['callRecordingURL'] = callRecordingURL;
            transcribedPatientText = await transcribeVoiceSTT(callRecordingURL);
        }

        response['status'] = "answered";

    } else {
        if ( call.status == "no-answer") {
            const smsInfo = await sendSms(phoneNumber, constants.UNANSWERED_CALL_TEXT_MESSAGE);
            if( smsInfo.status ){
                response['status'] = "SMS sent";
            }
        }
    }

    response['patientResponse'] = transcribedPatientText;

    await insertCall(response);

    console.log(response);
    return response;
}

export const receiveVoiceCall = async () => {
    let twiml = new Twilio.twiml.VoiceResponse();
    let start = twiml.start();
    start.stream({
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