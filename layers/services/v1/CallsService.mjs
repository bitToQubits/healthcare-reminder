import { Twilio } from "twilio";
import { ElevenLabsClient } from "elevenlabs";
import { createWriteStream } from "fs";

const accountSidTwilio = 'XXXXXXXXXXXXX';
const authTokenTwilio = 'your_auth_token';
const authTokenElevenLabs = '';
const relativeRouteForAudioFiles = '/assets/uploads/audio/';

const getVoiceCallResult = async () => {
    
}

const generateVoiceTTS = async (text, filename) => {
    return new Promise(async (resolve, reject) => {
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
        fileStream.on("error", reject); //TO-DO: throw an exception here.
    });
}

const transcribeVoiceSTT = async (audio_url) => {
    
}

const sendVoiceMail = async () => {
    
}

export const triggerVoiceCall = async (phoneNumber) => {
    const phoneNumberTwilio = "";
    const initialTextMessage = 
    `Hello, this is a reminder from your healthcare provider to confirm your medications for the day. 
    Please confirm if you have taken your Aspirin, Cardivol, and Metformin today.`;
    let initialAudioMessageUrl = await generateVoiceTTS(initialTextMessage, 'initialAudioMessage');
    const twilio = new Twilio(accountSidTwilio, authTokenTwilio);
    let twiml = Twilio.twiml.VoiceResponse();

    twiml.play(initialAudioMessageUrl);
    twiml.record();
    twiml.hangup();
    twiml = twiml.string();

    const call = await twilio.calls.create({
        from: phoneNumberTwilio,
        to: phoneNumber,
        twiml
    });

    return response;
}

export const receiveVoiceCall = async () => {

}

export const getAllVoiceCalls = async () => {

}