import { triggerVoiceCall } from '../../services/v1/CallsService.mjs'

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
                "msg": "Please specify a valid phone number."
            }
            res.status(400).json(response);
            return;
        }

        response = await triggerVoiceCall(phoneNumber);
        
        res.status(201).json(response);
    } catch(error) {
        response = {
            "status": false,
            "msg": error.message
        }
        res.status(500).json(response);
    }

};