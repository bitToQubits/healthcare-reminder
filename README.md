# Healthcare reminder
## Features
- Create outbound calls
- Receive inbound calls
- Track the status of each call
- Leave voicemails
- Get a report of all calls managed by the system
- SMS sending
## Prerequisites
- Make sure you have installed NodeJS version 23 or superior in your PC.
- Configure Deepgram
    - We will use Deepgram for STT, go to https://console.deepgram.com/ and create an account or sign in.
    - In the dashboard, search for the "Create API key" button, set a friendly name (for example "healthcare-stt"), and click in "Create key".
    - Copy your Deepgram API key, write it somewhere; you will need it.
    - Deepgram is now configured ✅
- Configure ElevenLabs
    - We will use ElevenLabs for TTS, go ahead to https://elevenlabs.io/app/sign-in and sign in or create an account. Follow the onboarding.
    - In the left sidebar, click on your profile (must be at the bottom) and then click on API keys. 
    - Click on "Create API key", put the api key a name (can be any name, eg. healthcare reminder) and then click on "Create".
    - Copy your API key and write it somewhere; you will need it.
    - ElevenLabs is now configured ✅
- Configure Ngrok 
    - Open https://ngrok.com in your browser, and click on sign in or sign up if you dont have an account.
    - Go to https://dashboard.ngrok.com/ and search on the sidebar for Getting Started > Setup & Installation. Follow the tutorial for your specific OS. 
    - Sometimes ngrok is flagged incorrectly as a malware, but dont worry, it is not. Mark the program as safe if this happens to you.
    - Run the ngrok service by going to the downloaded folder, opening up the terminal in that directory and then executing `ngrok http 5000` where 5000 is the port you prefer. Use 5000.
    - Ngrok will start, showing a domain you will use to expose this healthcare system to the internet. Search in the terminal for Forwarding, at the right you will see the domain, write it somewhere; you will need it. The domain will look like "https://72e3-2001-1308-29ed-5e00-ed90-107c-2b21-f8e1.ngrok-free.app"
    - Ngrok is now configured ✅
- Configure Twilio
    - Go to https://console.twilio.com/ and log-in into your account. If you dont have one, create one, and follow the onboard tutorial Twilio gives you.
    - **Webhook configuration and getting active phone**
    - In the sidebar at the left, search for Phone numbers > Manage > Active numbers and click on it.
    - You will see your active number, write it somewhere; you will need it. Then click on it.
    - Lets configure a weebhook so Twilio knows how to respond to an inbound call. 
    - Search for a field called "A call comes in", select weebook. At the right, you will see the "url" field. Put the following url ``https://your_ngrok_domain/api/v1/calls/inbound``
    - Select HTTP POST at the next field on the right.
    - **Obtaining API keys**
    - In the header of the site, search for "Admin" button, click on it and then click on Account Management. Verify your account if necessary. 
    - Then, search for your Account Sid, write it somewhere; you will need it.
    - Go to "API keys and credentials" on the sidebar.
    - Search for your Auth Token live credentials, write it somewhere; you will need it.
    - Twilio is now configured ✅
## Installation
1. Clone the repository in the folder you want it to be with
   ``git clone https://github.com/bitToQubits/healthcare-reminder.git``
   You can also download the ZIP file by clicking in the green button "Code" > Download ZIP. 
   Then unzip it in the folder of preference.
3. Install dependencies with
   ``npm install``
4. Create a .env file in the root directory of the system, where server.js is. Then write inside the .env file
```
AUTH_TOKEN_11LABS = Your elevenlabs API key
PHONE_NUMBER_TWILIO = A twilio phone number
ACCOUNT_SID_TWILIO = Account SID for twilio
AUTH_TOKEN_TWILIO = Auth token for twilio
SERVER_DOMAIN = Ngrok-generated domain
AUTH_TOKEN_DEEPGRAM = Authentaticacion token for Deepgram
PORT = The desired port you want to run the server. Write here "5000".
DB_URI = The MongoDB remote server URI
```
## Usage
