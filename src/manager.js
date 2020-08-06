const ID = require('./server_constants.js')
const Handlers = require('./handlers.js')
const Data = require('./data') 

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

exports.serverMessage = manageServerMessage
exports.directMessage = manageDMs 