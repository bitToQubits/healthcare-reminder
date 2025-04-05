import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

export default Object.freeze({
    ACCOUNT_SID_TWILIO: process.env.ACCOUNT_SID_TWILIO,
    AUTH_TOKEN_TWILIO: process.env.AUTH_TOKEN_TWILIO,
    AUTH_TOKEN_11LABS: process.env.AUTH_TOKEN_11LABS,
    AUTH_TOKEN_DEEPGRAM: process.env.AUTH_TOKEN_DEEPGRAM,
    SERVER_DOMAIN: process.env.SERVER_DOMAIN,
    INITIAL_TEXT_MESSAGE:
    `Hello, this is a reminder from your healthcare provider to confirm your medications for the day. 
    Please confirm if you have taken your Aspirin, Cardivol, and Metformin today`,
    UNANSWERED_CALL_TEXT_MESSAGE: 
    `We called to check on your medication but couldn't reach you. Please call us back or take your medications if you haven't done so.`,
    PHONE_NUMBER_TWILIO: process.env.PHONE_NUMBER_TWILIO,
    VOICE_ID_11LABS: '21m00Tcm4TlvDq8ikWAM',
    OUTPUT_FORMAT_11LABS: 'ulaw_8000',
    DB_URI: process.env.DB_URI,
    SERVER_PORT: process.env.PORT || 5000
});