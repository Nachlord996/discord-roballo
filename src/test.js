const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

// Load bot token from local file
let secret
try { secret = fs.readFileSync('botivian-secret.json') } catch { console.log('Create secret file before start')
  process.exit() }
let token = JSON.parse(secret).token;
client.login(token).then(initializeServer, () => console.log("invalid token, quiting..."))

function initializeServer(){
  console.log("Botiviano listo!")
}

