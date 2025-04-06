import { 
    triggerVoiceCall, 
    leaveVoiceMail, 
    receiveVoiceCall, 
    getAllVoiceCalls as getVoiceCalls,
    changeStatusVoiceCall,
    handleDualAudioStream
} from '../../services/v1/CallsService.mjs';
import constants from '../../../utils/constants.mjs';

/**
 * Handle an outbound voice call using Twilio API.
 * @category CallsController
 * @author jlbciriaco[at]gmail.com
 * @param  {Number} phone_number    The phone number to call.
 * @return {Response}               The status for the voice call.
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

/**
 * Leave a voice mail if machine responds to a Twilio-initiated voice call.
 * @category CallsController
 * @author jlbciriaco[at]gmail.com
 * @param  {String} CallSid     A unique identifier generated by Twilio for this call
 * @param  {String} AccountSid  Twilio account ID
 * @param  {String} AnsweredBy  The result of Twilio algorithm for detecting machines in voice calls
 * @return {Response}           The status for the voice mail
 */
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

/**
 * Status callback for a change in a Twilio voice call status. 
 * @category CallsController
 * @author jlbciriaco[at]gmail.com
 * @param  {Object} CallResource    The twilio response. Get more info at https://static1.twilio.com/docs/voice/api/call-resource 
 * @return {XMLDocument}            The status change for the voice call.
 */
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

    response = await changeStatusVoiceCall(callInfo);
    res.status(201).json(response);
}

/**
 * Handle incoming voice call using Twilio API.
 * @category CallsController
 * @author jlbciriaco[at]gmail.com
 * @return {XMLDocument}      The TwiML who controls the conversation flow.
 */
export const receiveCall = async (req, res) => {
    const voiceCallResponse  = await receiveVoiceCall();

    res.header("Content-Type", "application/xml");
    res.status(200).send(voiceCallResponse);
};

/**
 * Get all voice calls captured by the system
 * @category CallsController
 * @author jlbciriaco[at]gmail.com
 * @return {Response}      Status and content for the voice calls fetching.
 */
export const getAllVoiceCalls = async (req, res) => {
    let voiceCalls  = await getVoiceCalls();

    const response = {
        "status": true,
        "message": "Data successfully retrieved",
        "content": voiceCalls
    }

    res.status(200).json(response);
}

/**
 * Handle the websocket feature for voice calls, particularly the audio streaming.
 * @category CallsController
 * @author jlbciriaco[at]gmail.com
 * @param  {Number} textID The ID for the text desired to stream
 */
export const handleAudioStream = async (ws, req) => {
    let textID = parseInt(req.params.id_text);

    /* 
        If request is not for unanswered/reminder calls audio streaming, 
        close the connection. 
    */

    if(![1,2].includes(textID)){
        ws.close();
        return;
    }

    handleDualAudioStream(textID, ws);
}