import { Twilio } from "twilio";
import { ElevenLabsClient } from "elevenlabs";
import { createWriteStream } from "fs";
import { createClient } from "@deepgram/sdk";
import { insertCall, getAllCalls, } from '../../models/v1/CallsModel.mjs';

const accountSidTwilio = '';
const authTokenTwilio = '';
const authTokenElevenLabs = '';
const authTokenDeepgram = '';
const relativeRouteForAudioFiles = '/assets/uploads/audio/';
const rootPath = '';
const unansweredCallTextMessage = 
`We called to check on your medication but couldn't reach you. 
Please call us back or take your medications if you haven't done so.`;
const phoneNumberTwilio = "";
const initialTextMessage = 
`Hello, this is a reminder from your healthcare provider to confirm your medications for the day. 
Please confirm if you have taken your Aspirin, Cardivol, and Metformin today.`;

const sendSms = async (phoneNumber, text) => {
    let response = {};
    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    const message = await twilio.messages.create({
        body: text,
        from: phoneNumberTwilio,
        to: phoneNumber
    });

    if ( message.body.sid ) {
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

const generateVoiceTTS = async (text, filename) => {
    return new Promise(async (resolve) => {
        const elevenlabs = new ElevenLabsClient({
            apiKey: authTokenElevenLabs, 
        });

        const audio = await elevenlabs.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
            text,
            model_id: "eleven_multilingual_v2",
            output_format: "mp3_44100_128",
        });
        const fileName = relativeRouteForAudioFiles+`${filename}.mp3`;
        const fileStream = createWriteStream(fileName);

        audio.pipe(fileStream);
        fileStream.on("finish", () => resolve(fileName));
        fileStream.on("error", (err) => {
            if (err) throw err;
        });
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

    if ( ! ["machine_end_beep", "machine_end_silence", "machine_end_other"].includes(answeredBy) ) {
        return {
            "status": true,
            "message": "Machine didn't respond."
        }
    }

    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    const unansweredCallAudioUrl = await generateVoiceTTS(unansweredCallTextMessage, 'unansweredCallAudioMessage');
    let twiml = Twilio.twiml.VoiceResponse();

    twiml.play(rootPath+'/'+unansweredCallAudioUrl);
    twiml.hangup();
    twiml = twiml.string();

    const call = await twilio.calls(callSid).update(
        {
            twiml
        }
    )

    await insertCall(response);

    return {
        "status": true,
        "message": "Machine did respond and voice mail was leaved."
    }
}

export const triggerVoiceCall = async (phoneNumber) => {
    let response = {};
    const initialAudioMessageUrl = await generateVoiceTTS(initialTextMessage, 'initialAudioMessage');
    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    let twiml = Twilio.twiml.VoiceResponse();
    let transcribedPatientText = "";

    twiml.play(rootPath+'/'+initialAudioMessageUrl);
    twiml.record();
    twiml.hangup();
    twiml = twiml.string();

    const call = await twilio.calls.create(
        {
            from: phoneNumberTwilio,
            to: phoneNumber,
            twiml,
            machineDetection: "DetectMessageEnd",
            AsyncAmdStatusCallback: rootPath + '/api/v1/sendVoiceMail'
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
            transcribedPatientText = await transcribeVoiceSTT(callRecordingURL);
        }

    } else {
        if ( call.status == "no-answer") {
            let smsInfo = await sendSms(phoneNumber, unansweredCallTextMessage);
            if( smsInfo.status ){
                response['status'] = "SMS sent";
            }
        }
    }

    response['patientResponse'] = transcribedPatientText;

    await insertCall(response);

    return response;
}

export const receiveVoiceCall = async () => {
    const initialAudioMessageUrl = await generateVoiceTTS(initialTextMessage, 'initialAudioMessage');
    let twiml = Twilio.twiml.VoiceResponse();

    twiml.play(rootPath+'/'+initialAudioMessageUrl);
    twiml.record();
    twiml.hangup();
    return twiml.string();
}

export const getAllVoiceCalls = async () => {
 return await getAllCalls();
}