const Discord = require('discord.js');
const client = new Discord.Client();

const Scheduler = require('node-schedule');
const ID = require('./server_constants.js')
const { eventsCheck } = require('./event.js')
const { serverMessage, directMessage, memberAdded } = require('./manager') 
const fs = require('fs');
const Data = require('./data')

exports.client = client

exports.Scheduler = Scheduler

// Load bot token from local file
let secret
try { secret = fs.readFileSync('secret.json') } catch { console.log('Create secret file before start')
  process.exit()}
let token = JSON.parse(secret).token;
const init_promise = this.client.login(token);

// Set server initialization to login callback
init_promise.then(initializeServer, (() => console.log('Invalid token, exiting...')))

function initializeServer() {
  console.log('Building up server, this may take a while...')

  var rule = new Scheduler.RecurrenceRule(null, null, null, null, 4, 0);
  Scheduler.scheduleJob(rule, eventsCheck)

  Data.loadMembersinfo(client)

  // Middleware for upcoming messages and events
  client.on('message', (message) => { if (!IsbotMessage(message)) { if (message.channel.type === 'dm') { directMessage(client, message) } else { serverMessage(client,message) } } })
  client.on('guildMemberAdd', (member) => memberAdded(member))
  
  console.log('Server is up, bot commands are now available!')
}

function IsbotMessage(message) { return message.author.id === ID.ROBALLO_HEIR_ID }


