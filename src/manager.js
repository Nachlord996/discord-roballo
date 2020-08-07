const ID = require('./server_constants.js')
const Handlers = require('./handlers.js')
const Data = require('./data') 
const Scheduler = require('node-schedule');

function manageDMs(client, message) {

    var message_sender = Data.humans.find((human) => { return human.dm_id === message.author.id })
    if (message_sender != undefined) {
        switch (message_sender.state) {
            case ID.talking_states.IDLE:
                if (message.content.startsWith('!')) {
                    var cmd = message.content.split(" ")
                    switch (cmd[0]) {
                        case '!subscribe':
                            if (cmd.length == 1) {
                                Handlers.subscribeHandler(message)
                            }
                            break;
                        case '!help':
                            if (cmd.length == 1) {
                                Handlers.helpHanlder(message, true)
                            }
                            break;
                        case '!event':
                            if (cmd.length == 1) {
                                message_sender.state = ID.talking_states.WAITING
                                message_sender.requestState = 0
                                message_sender.chatHandler =  Handlers.requestEventData
                                Handlers.requestEventData(client, message, message_sender)
                            }
                            break
                        case '!guest':
                            if (cmd.length == 1){       
                                Handlers.guestHandler(client, message)
                            }
                            break
                        default:
                            break;
                    }
                }
                break;
            case ID.talking_states.WAITING:
                if (message.content === '!cancel') {
                    message_sender.state = ID.talking_states.IDLE
                    Handlers.cancelmessage(client, message_sender)
                } else {
                    if (message_sender.chatHandler(client, message, message_sender)) {
                        message_sender.state = ID.talking_states.IDLE
                    }
                }
            default:
                break;
        }
    }
}


function manageServerMessage(client, message) {
    if (message.content.startsWith('!')) {
        var cmd = message.content.split(" ")
        switch (cmd[0]) {
            case '!help':
                if (cmd.length === 1) {
                    Handlers.helpHanlder(message, false);
                }
                break;
            default:
                break;
        }
    }
}

function memberAdded(member){
    member.guild.fetchInvites().then((invs) => {
        const old_invites = Data.cache_invites
        Data.cache_invites = invs
        const invite = invs.find(i => old_invites.get(i.code).uses < i.uses)
        
        const temporal = Data.invites.find(x => (x.code === invite.code) && (x.start_date == undefined))
        if (temporal != undefined){
            temporal.start_date = Date.now()
            var role = member.guild.roles.cache.find(role => role.name === "Guest");
            member.roles.add(role)
            var j = Scheduler.scheduleJob(addHours(Date.now(), 1), function(member){
                member.kick().then((sec) => {console.log(sec)}, (err) => {console.log(err)} )
              }.bind(null, member))
              console.log(j.nextInvocation())
        }

    } , (err) => console.log(err))
}


function addHours(date, hours) {
   var d = date + (hours * 3600 * 1000)    
   return new Date(d);
}

function addseconds(date, scn) {
    var d = date + (scn * 1000)    
    return new Date(d);
 }

exports.memberAdded = memberAdded
exports.serverMessage = manageServerMessage
exports.directMessage = manageDMs 