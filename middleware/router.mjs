import { 
    makeCall, 
    sendVoiceMail, 
    getAllVoiceCalls, 
    receiveCall, 
    handleAudioStream 
} from '../layers/controllers/v1/CallsController.mjs';
import { Router } from 'websocket-express';

const router = new Router();

router.post('/v1/calls/outbound', makeCall);
router.post('/v1/calls/voiceMail', sendVoiceMail);
router.post('/v1/calls/inbound', receiveCall);
router.get('/v1/calls', getAllVoiceCalls);
router.ws('/v1/calls/audiostream/:id_text', handleAudioStream);

export default router;