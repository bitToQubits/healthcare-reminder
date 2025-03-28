import express from 'express';
import { makeCall } from '../layers/controllers/v1/CallsController.mjs';

const router = express.Router();

router.post('/v1/calls', makeCall);

export default router;