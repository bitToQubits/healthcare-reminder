import express from 'express';
import { makeCall, sendVoiceMail, getAllVoiceCalls, receiveCall } from '../layers/controllers/v1/CallsController.mjs';

const router = express.Router();

router.post('/v1/calls/outbound', makeCall);
router.post('/v1/calls/voiceMail', sendVoiceMail);
router.post('/v1/calls/inbound', receiveCall);
router.get('/v1/calls', getAllVoiceCalls);

export default router;