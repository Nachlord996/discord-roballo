const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';
var channel;

const client = new Discord.Client();

client.on('message', (message) => {
    console.log('new msg arriving, identifying channel...');
    
    if (message.channel.name === 'devchannel'){
        const time = new Date();
        var timestamp = time.getHours() + ':' + time.getMinutes();
        console.log('Nuevo mensaje desde canal Desarrollador (' + timestamp + ')');
        channel = message.channel;
        if (message.content.startsWith('!Start') && message.content.length == 6){
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                    // Authorize a client with credentials, then call the Google Calendar API.
                    authorize(JSON.parse(content), listEvents);
            });
        }
    }
})

client.login('NjkzOTAyMDc5MTk4MTAxNjE0.XoD1zQ.OXSmHDQG4KmlfFkI5Hg6GENiZ-o');


// Load client secrets from a local file.
  
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  function listEvents(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.calendarList.list()
    calendar.events.list({
      calendarId: 't1n8ebnid0894q6snr02hbv4l8@group.calendar.google.com',
      timeMin: (new Date()).toISOString(),
      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
    }, (error, res) => {
      if (error) return console.log('Fallo en la call de la API: ' + error);
      const events = res.data.items;
      if (events.length) {
        events.map((event, i) => {
         sendEvent(event);
        });
      } else {
        console.log('No hay eventos en el calendario.');
      }
    });
  }

  function sendEvent(event){
      var title = '**' + event.summary + '**';
      var date = event.start.date;
      var desc = event.description;
    channel.send(title + '\n' + date + '\n' + desc);
  }