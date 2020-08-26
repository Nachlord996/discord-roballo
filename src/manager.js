const Discord = require('discord.js');
const ID = require('./server_constants.js')
const Handlers = require('./handlers.js')
const Data = require('./data')
const Events = require('./event')
const Scheduler = require('node-schedule');
const Human = require('./human')

function manageMessage(client, message, is_dm) {

    var message_sender = Data.humans.find((human) => { return human.dm_id === message.author.id })
    if (message_sender != undefined) {
        switch (message_sender.state) {
            case ID.talking_states.IDLE:
                if (message.content.startsWith('!')) {
                    manageCommand(client, message, message_sender, is_dm)
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
                break;
            default:
                break;
        }
    }
}

function memberAdded(member) {
    member.guild.fetchInvites().then((invs) => {
        const old_invites = Data.cache_invites
        Data.cache_invites = invs
        const invite = invs.find(i => old_invites.get(i.code).uses < i.uses)

        const temporal = Data.invites.find(x => (x.code === invite.code) && (x.start_date == undefined))
        if (temporal != undefined) {
            temporal.start_date = Date.now()
            var role = member.guild.roles.cache.find(role => role.name === "Guest");
            member.roles.add(role)
            member.guild.channels.cache.get(ID.MAIN_CHANNEL_ID).send(
                new Discord.MessageEmbed(
                    {
                        color: '#2d37a6',
                        title: "🛎️ ¡ Unión temporal detectada ! 🛎️",
                        description: 'Bienvenido <@' + member.id + '>!\nDisfruta tu estadía en el servidor, la misma durará únicamente 2 horas.\n\nRecuerda que puedes consultar el tiempo restante con el comando:\n`!timeleft`'
                    }
                ))

            var admission = Date.now()
            var expulsion = addHours(admission, 2)
            Data.addGuest(member.displayName, member.id, admission, expulsion)

            Scheduler.scheduleJob(addHours(Date.now(), 2), function (member) {
                member.kick() }.bind(null, member))

            invs.find(i => old_invites.get(i.code).uses < i.uses).delete()
        }

    }, (err) => console.log(err))
}

function manageCommand(client, message, sender, is_dm) {
    var cmd = message.content.split(" ")
    if (cmd.length == 1) {
        switch (cmd[0]) {
            case '!subscribe':
                Handlers.subscribeHandler(message)
                break;
            case '!help':
                Handlers.helpHanlder(message, is_dm)
                break;
            case '!event':
                sender.state = ID.talking_states.WAITING
                sender.requestState = 0
                sender.chatHandler = Handlers.requestEventData
                Handlers.requestEventData(client, message, sender)
                break
            case '!guest':
                Handlers.guestHandler(client, message)
                break
            case '!fetchEvents':
                Events.eventsCheck(client)
            case '!week':
                Handlers.weekTasksHandler(client, message)
                break
            case '!timeleft':
                Handlers.timeleftHandler(client, message)
                break;
            default:
                Handlers.unknownCmdHandler(message)
        }
    }
}

    function addHours(date, hours) {
        var d = date + (hours * 3600 * 1000)
        return d;
    }

    exports.memberAdded = memberAdded
    exports.manageMessage = manageMessage