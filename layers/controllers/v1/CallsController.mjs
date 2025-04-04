import { 
    triggerVoiceCall, 
    leaveVoiceMail, 
    receiveVoiceCall, 
    getAllVoiceCalls as getVoiceCalls,
    generateVoiceTTS,
    changeStatusVoiceCall
} from '../../services/v1/CallsService.mjs';
import { streamToArrayBuffer } from '../../../utils/dataConversions.mjs';
import { isJsonString } from '../../../utils/dataValidation.mjs';
import { wait } from '../../../utils/miscellaneous.mjs';
import { Readable } from 'stream';
import constants from '../../../utils/constants.mjs';

/* 
    TO-DO: 
    webhook en twilio, que las llamadas se actualizen sola cuando ya este en queue. Que twilio llame a nuestra api.
    manage better the asyncronous and syncronous calls, 
    error handling, 
    streaming of elevenlabs, 
    readme, 
    unit testing, 
    documentatio in the functions,
    check for requirements,
    check the status for the calls, manage that edge cases.
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

    if (AccountSid != constants.ACCOUNT_SID_TWILIO) {
        response = {
            "status": false,
            "message": "Must provide a valid account SID for this service."
        }
        res.status(400).json(response);
        return;
    }

    response = await leaveVoiceMail(CallSid, AnsweredBy);
    res.status(201).json(response);
}

export const handleStatusChange = async (req, res) => {
    const callInfo = req.body;
    const accountSid = req.body.AccountSid;
    let response = {};

    if (accountSid != constants.ACCOUNT_SID_TWILIO) {
        response = {
            "status": false,
            "message": "Must provide a valid account SID for this service."
        }
        res.status(400).json(response);
        return;
    }

    await wait(2000);
    response = await changeStatusVoiceCall(callInfo);
    res.status(201).json(response);
}

export const receiveCall = async (req, res) => {
    const voiceCallResponse  = await receiveVoiceCall();

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

export const handleAudioStream = async (ws, req) => {
    let id_text = parseInt(req.params.id_text);

    /* 
        If request is not for unanswered call/reminder calls audio streaming, 
        close the connection. 
    */

    if(![1,2].includes(id_text)){
        ws.close();
        return;
    }

    ws.on('message', async (data) => {
        if(!isJsonString(data)){
            return;
        }

        const message = JSON.parse(data);
        let stopMessageSending = false;
        let response = "";
        
        if(!message.event){
            return;
        }
        
        console.log(message);
        if(!["mark", "start"].includes(message.event)){
            return;
        }


        if( message.event == "mark" ){
            if( message.mark.name == "stoppedPlaying" ) {
                ws.close();
                return;
            }
        }
        
        const streamSid = message.start.streamSid;
        
        await generateVoiceTTS(id_text)
        .then((data) => {response = data})
        .catch((err) => {stopMessageSending = true});
        
        if(stopMessageSending) {
            return;
        }
        
        const readableStream = Readable.from(response);
        const audioArrayBuffer = await streamToArrayBuffer(readableStream);

        ws.send(
            JSON.stringify({
                streamSid,
                "event": 'media',
                "media": {
                    payload: Buffer.from(audioArrayBuffer).toString('base64'),
                },
            })
        );
        ws.send(
            JSON.stringify({
                streamSid,
                "event": 'mark',
                "mark": {
                    "name": "stoppedPlaying",
                },
            })
        );
    });

    ws.on('error', () => {
        ws.close();
    });
}