import Twilio from 'twilio';
import { ElevenLabsClient } from "elevenlabs";
import { createClient } from "@deepgram/sdk";
import { insertCall, getAllCalls } from '../../models/v1/CallsModel.mjs';
import dotenv from 'dotenv';

dotenv.config();

const accountSidTwilio = process.env.ACCOUNT_SID_TWILIO;
const authTokenTwilio = process.env.AUTH_TOKEN_TWILIO;
const authTokenElevenLabs = process.env.AUTH_TOKEN_11LABS;
const authTokenDeepgram = process.env.AUTH_TOKEN_DEEPGRAM;
const SERVER_DOMAIN = process.env.SERVER_DOMAIN || 'localhost';
const unansweredCallTextMessage = 
`We called to check on your medication but couldn't reach you. 
Please call us back or take your medications if you haven't done so.`;
const phoneNumberTwilio = process.env.PHONE_NUMBER_TWILIO;
const initialTextMessage = 
`Hello, this is a reminder from your healthcare provider to confirm your medications for the day. 
Please confirm if you have taken your Aspirin, Cardivol, and Metformin today.`;
const voiceId = '21m00Tcm4TlvDq8ikWAM';
const outputFormatElevenLabs = 'ulaw_8000';

const sendSms = async (phoneNumber, text) => {
    let response = {};
    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    const message = await twilio.messages.create({
        body: text,
        from: phoneNumberTwilio,
        to: phoneNumber
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
    const elevenlabs = new ElevenLabsClient(authTokenElevenLabs);
    let text = "";

    switch(text_id) {
        case "1":
            text = initialTextMessage;
            break;
        case "2":
            text = unansweredCallTextMessage;
            break;
    }

    return await elevenlabs.textToSpeech.convert(voiceId, {
        model_id: 'eleven_flash_v2_5',
        output_format: outputFormatElevenLabs,
        text,
    });
}

const transcribeVoiceSTT = async (audio_url) => {
    const deepgram = createClient(authTokenDeepgram);
    const { result, err } = await deepgram.listen.prerecorded.transcribeUrl(
        {
            url: audio_url,
        },
        {
            model: "nova-3",
            smart_format: true,
        }
    );

    if (err) throw err;

    return result.channels[0].alternatives[0].transcript;
}

export const depositVoiceMail = async (callSid, answeredBy) => {
    if (!["machine_end_beep", "machine_end_silence", "machine_end_other"].includes(answeredBy)) {
        return {
            "status": true,
            "message": "Machine didn't respond."
        }
    }

    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    let twiml = new Twilio.twiml.VoiceResponse();
    const start = twiml.start();
    start.stream({
        name: 'unansweredCallAudioMessage',
        url: `wss://${SERVER_DOMAIN}/api/v1/calls/audiostream/2`,
    });

    response.hangup();
    twiml = twiml.toString();

    const call = await twilio.calls(callSid).update(
        {
            twiml
        }
    )

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
    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    let twiml = new Twilio.twiml.VoiceResponse();
    let transcribedPatientText = "";
    const start = twiml.start();
    start.stream({
        name: 'initialAudioMessage',
        url: `wss://${SERVER_DOMAIN}/api/v1/calls/audiostream/1`,
    });
    twiml.record();
    twiml.hangup();
    twiml = twiml.toString();

    const call = await twilio.calls.create(
        {
            from: phoneNumberTwilio,
            to: phoneNumber,
            twiml,
            machineDetection: "DetectMessageEnd",
            AsyncAmdStatusCallback: SERVER_DOMAIN + '/api/v1/sendVoiceMail'
        }
    );

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
        );

        if( callRecordings.length > 0 ){
            const callRecordingID = callRecordings[0].sid;
            const callRecordingURL = 
            `https://api.twilio.com/2010-04-01/Accounts/${accountSidTwilio}/Recordings/${callRecordingID}.mp3`;
            response['callRecordingURL'] = callRecordingURL;
            transcribedPatientText = await transcribeVoiceSTT(callRecordingURL);
        }

        response['status'] = "answered";

    } else {
        if ( call.status == "no-answer") {
            const smsInfo = await sendSms(phoneNumber, unansweredCallTextMessage);
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
        url: `wss://${SERVER_DOMAIN}/api/v1/calls/audiostream/1`,
    });

    twiml.record();
    twiml.hangup();
    return twiml.toString();
}

export const getAllVoiceCalls = async () => {
 return await getAllCalls();
}