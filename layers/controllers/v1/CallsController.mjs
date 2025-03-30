import { triggerVoiceCall, depositVoiceMail, receiveVoiceCall } from '../../services/v1/CallsService.mjs';

const accountSidTwilio = '';

export const makeCall = async (req, res) => {

    const phoneNumber = req.body.phone_number;
    let response = {};

    try {
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
    } catch(error) {
        response = {
            "status": false,
            "message": error.message
        }
        res.status(500).json(response);
    }

};

export const sendVoiceMail = async(req, res) => {

    let { CallSid, AccountSid, AnsweredBy } = req.body;

    try {
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
    } catch(error) {
        response = {
            "status": false,
            "message": error.message
        }
        res.status(500).json(response);
    }
}

export const receiveCall = async (req, res) => {
    let response = {};

    try {
        let voiceCallResponse  = await receiveVoiceCall();

        res.header("Content-Type", "application/xml");
        res.status(200).send(voiceCallResponse);
    } catch (error) {
        response = {
            "status": false,
            "message": error.message
        }
        res.status(500).json(response);
    }
};

export const getAllVoiceCalls = async(req, res) => {

    let response = {};

    try {
        let voiceCalls  = await getAllVoiceCalls();

        response = {
            "status": false,
            "message": "Data successfully retrieved",
            "content": voiceCalls
        }

        res.status(200).json(response);
    } catch (error) {
        response = {
            "status": false,
            "message": error.message
        }
        res.status(500).json(response);
    }
}