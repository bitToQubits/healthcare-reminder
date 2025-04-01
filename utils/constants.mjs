import dotenv from 'dotenv';
dotenv.config();

export default Object.freeze({
    ACCOUNT_SID_TWILIO: process.env.ACCOUNT_SID_TWILIO,
    AUTH_TOKEN_TWILIO: process.env.AUTH_TOKEN_TWILIO,
    AUTH_TOKEN_11LABS: process.env.AUTH_TOKEN_11LABS,
    AUTH_TOKEN_DEEPGRAM: process.env.AUTH_TOKEN_DEEPGRAM,
    SERVER_DOMAIN: process.env.SERVER_DOMAIN || 'localhost',
    UNANSWERED_CALL_TEXT_MESSAGE: 
    `We called to check on your medication but couldn't reach you. 
    Please call us back or take your medications if you haven't done so.`,
    PHONE_NUMBER_TWILIO: process.env.PHONE_NUMBER_TWILIO,
    VOICE_ID_11LABS: '21m00Tcm4TlvDq8ikWAM',
    OUTPUT_FORMAT_11LABS: 'ulaw_8000',
    DB_IP_ADDRESS: process.env.IP_ADDRESS_MONGODB || 'localhost',
    DB_PORT: process.env.PORT_MONGODB || '27017'
});