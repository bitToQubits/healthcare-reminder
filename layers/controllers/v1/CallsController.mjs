import { 
    triggerVoiceCall, 
    depositVoiceMail, 
    receiveVoiceCall, 
    getAllVoiceCalls as getVoiceCalls,
    generateVoiceTTS
} from '../../services/v1/CallsService.mjs';
import { streamToArrayBuffer } from '../../../utils/dataConversions.mjs';

const accountSidTwilio = '';

/* 
    TO-DO: 
    manage better the asyncronous and syncronous calls, 
    error handling, 
    streaming of elevenlabs, 
    readme, 
    unit testing, 
    documentation,
    check for requirements
*/

export const makeCall = async (req, res) => {
    let phoneNumber = req.body.phone_number;
    let response = {};

    if (
        typeof phoneNumber != "string" || 
        phoneNumber.trim() == ""
    ) {
        response = {
            "status": false,
            "message": "Please specify a valid phone number."
        }
        res.status(400).json(response);
        return;
    }

    phoneNumber = phoneNumber.trim();

    response = await triggerVoiceCall(phoneNumber);
    res.status(201).json(response);
};

export const sendVoiceMail = async (req, res) => {
    let { CallSid, AccountSid, AnsweredBy } = req.body;
    let response = {};

    if ( 
        AccountSid != accountSidTwilio
    ) {
        response = {
            "status": false,
            "message": "Must provide a valid account SID for this service."
        }
        res.status(400).json(response);
        return;
    }

    response = await depositVoiceMail(CallSid, AnsweredBy);
    res.status(201).json(response);
}

export const receiveCall = async (req, res) => {
    let voiceCallResponse  = await receiveVoiceCall();

    res.header("Content-Type", "application/xml");
    res.status(200).send(voiceCallResponse);
};

export const getAllVoiceCalls = async (req, res) => {
    let voiceCalls  = await getVoiceCalls();

    const response = {
        "status": true,
        "message": "Data successfully retrieved",
        "content": voiceCalls
    }

    res.status(200).json(response);
}

export const handleAudioStream = async (req, res) => {
    const ws = await res.accept();

    let id_text = req.params.id_text;

    if(isNaN(id_text)){
        const response = {
            "status": false,
            "message": "Please specify a valid ID for the TTS software."
        }
        res.status(400).json(response);
        return;
    }

    /* Courtesy of elevenlabs.io */

    ws.on('message', async (data) => {
        const message = {
            event,
            start: { streamSid, callSid }
          } = JSON.parse(data);

          if (message.event === 'start' && message.start) {
            const streamSid = message.start.streamSid;
            const response = await generateVoiceTTS(id_text)
            const readableStream = Readable.from(response);
            const audioArrayBuffer = await streamToArrayBuffer(readableStream);
            ws.send(
              JSON.stringify({
                streamSid,
                event: 'media',
                media: {
                  payload: Buffer.from(audioArrayBuffer).toString('base64'),
                },
              })
            );
        }
    });

    ws.on('error', (err) => {
        if (err) throw err;
    });
}