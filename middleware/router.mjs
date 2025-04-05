import { 
    makeCall, 
    sendVoiceMail, 
    getAllVoiceCalls, 
    receiveCall, 
    handleAudioStream,
    handleStatusChange,
} from '../layers/controllers/v1/CallsController.mjs';
import express from "express";

const router = new express.Router();

export const mountRouter = () => {
    router.post('/v1/calls/outbound', makeCall);
    router.post('/v1/calls/voiceMail', sendVoiceMail);
    router.post('/v1/calls/inbound', receiveCall);
    router.post('/v1/calls/status', handleStatusChange);
    router.get('/v1/calls', getAllVoiceCalls);
    router.ws('/v1/calls/audiostream/:id_text', handleAudioStream);
}

export default router;