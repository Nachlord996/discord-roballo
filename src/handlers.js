const Discord = require('discord.js');
const Data = require('./data') 
const ID = require('./server_constants')
const main = require('./main')
const { calendar_event } = require('./event')

function requestEventData(client, message, human) {
    var sub_account = client.guilds.cache.get(ID.SERVER_ID).members.cache.get(human.dm_id)
    switch (human.requestState) {
        case 0:
            sub_account.send(new Discord.MessageEmbed({
                color: '#2d37a6',
                title: "🚧 ¡ Dejame ayudarte con eso ! 🚧",
                description: 'Puedes agregar un nuevo evento en mi inmenso calendario.\nYo te guiaré en la preparación, así que despreocúpate.\n\nRecuerda que puedes cancelar la creación en cualquier momento con el comando\n`!cancel`'
            })).then(
                (success) => {
                    sub_account.send(new Discord.MessageEmbed({
                        color: '#2d37a6',
                        title: "Paso 1 ✅",
                        description: 'Ingresa el título del evento\nPor ejemplo: `Parcial de Algoritmos`'
                    }))
                }, (reason) => console.log('An error has occured while sending dm message: ' + reason))
            human.requestState = 1
            break;
        case 1:
            human.requestData = { event_title: message.content }

            sub_account.send(new Discord.MessageEmbed({
                color: '#2d37a6',
                title: "Paso 2 ✅",
                description: 'Ingresa una descripción para el evento\nPor ejemplo: `Temas: Grafos y Tablas Hash`'
            }))
            human.requestState = 2
            break;

        case 2:
            human.requestData.event_description = message.content

            sub_account.send(new Discord.MessageEmbed({
                color: '#2d37a6',
                title: "Último paso ✅",
                description: 'Ingresa la fecha y hora del evento. ¡ Ten cuidado, mis sistemas no aceptan entradas de baja calidad !\nTe dejo un ejemplo: `9/21/2020 18:15`'
            }))
            human.requestState = 3
            break;

        case 3:
            var parsedDate = Date.parse(message.content)

            if (Number.isNaN(parsedDate) || parsedDate <= Date.now()) {

                sub_account.send(new Discord.MessageEmbed({
                    color: '#2d37a6',
                    title: "Algo ha salido mal... 🏂🏼",
                    description: 'Las fechas pueden ser difíciles de escribir. Inténtalo de nuevo !'
                }))

                return false;
            }

            sub_account.send(new Discord.MessageEmbed({
                color: '#2d37a6',
                title: "🤖 ¡ Todo está listo ! 🤖",
                description: 'Tu evento ha sido creado con éxito, ahora solo queda esperar !'
            }))

            human.requestState = 0
            var ev_title = human.requestData.event_title
            var ev_description = human.requestData.event_description
            Data.events.push(new calendar_event(ev_title, ev_description, parsedDate))

            main.Scheduler.scheduleJob(new Date(parsedDate), () => {
                var announcement_channel = client.channels.cache.get(ID.ANNOUNCEMENTS_CHANNEL_ID)

                var event_message = new Discord.MessageEmbed({
                    color: '#2d37a6',
                    title: "⏳¡ Hay un evento en curso ! ⏳",
                    fields: [
                        {
                            name: 'Título',
                            value: ev_title,
                            inline: true
                        },
                        {
                            name: 'Descripción',
                            value: ev_description
                        }
                    ]
                })
                // Send Discord message to announcements channel
                announcement_channel.send(event_message)
            })
            return true;
        default:
            break;
    }
}


function helpHanlder(message, is_dm_channel) {
    var user = message.author.username

    if (!is_dm_channel) {
        message.channel.send(new Discord.MessageEmbed({
            color: '#2d37a6',
            description: '<@' + message.author.id + '>' + '. La ayuda fue enviada por nuestro agente de DMs !'
        })).catch((error) => { console.log(`No se pudo enviar notificación por canal: ${message.channel.name}`) })
    }

    message.author.send(new Discord.MessageEmbed({
        title: '🤖 ¿ En qué puedo ayudarte ? 🤖',
        color: '#2d37a6',
        fields: [
            {
                name: 'Solicitante',
                value: user,
                inline: true
            },
            {
                name: 'version',
                value: 'v1.1.0',
                inline: true
            }
        ],
        description: "Hola, soy el ayudante especial de `Virtual UCU`.\n¿Existe algo peor que las clases por Zoom?\n\n¡Estos comandos te harán sentir un dios todopoderoso! Bueno, tal vez no tanto.\n🔻 `!help` - Solicita ayuda\n🔻 `!subscribe` - Recibe notificaciones a los eventos mediante DMs\n🔻 `!event` - Añade un evento nuevo al calendario 🛠\n🔻 `!cancel` - Elimina la solicitud en progreso\n\nEl ícono 🛠 indica fase experimental.\nSeguimos trabajando en traer nuevas herramientas.\n\nAnímate compañero 💪"
    }))
    console.log('message sent to: ' + message.author.username)
}

function subscribeHandler(message) {
    var isSubscriber = Data.calendar_subscribers.find((value) => { return value.sub_dm_id === message.author.id })
    if (!isSubscriber) {
        Data.calendar_subscribers.push({
            sub_id: Data.calendar_subscribers.length,
            sub_dm_id: message.author.id
        })

        var response = new Discord.MessageEmbed({
            title: '🤖 Suscripción exitosa 🤖',
            color: '#2d37a6',
            description: "¡ Que alegría, un nuevo suscriptor ! Un placer servirte " + '<@' + message.author.id + '>' + "\n\nRecuerda que siempre puedes dejar de recibir mensajes con el comando \n🔻 `!unsubscribe`"
        })

    } else {
        var response = new Discord.MessageEmbed({
            title: '🤖 Tómalo con calma... 🤖',
            color: '#2d37a6',
            description: "\n¡ Ya eres parte de los suscriptores, puedes esperar tranquilamente !"
        })

    }

    message.channel.send(response)
}

function sendCancelationMessage(client, sender) {
    var sub_account = client.guilds.cache.get(ID.SERVER_ID).members.cache.get(sender.dm_id)
    sub_account.send(new Discord.MessageEmbed({
        color: '#2d37a6',
        title: "🤖 ¡ Te estaré esperando ! 🤖",
        description: 'La cancelación se ha realizado con éxito, vuelve cuando quieras.'
    }))
}

function guestHandler(client, message){
    client.guilds.cache.get(ID.SERVER_ID).channels.cache.get(ID.MAIN_CHANNEL_ID).createInvite({unique: true, maxAge: 300})
    .then(
        (invite) => {
            var temporal = new temporal_membership(invite.code, message.author.id)
            Data.invites.push(temporal)
            message.channel.send(new Discord.MessageEmbed(
                {
                    color: '#2d37a6',
                    title: "🤖 ¡ Tenemos un nuevo invitado ! 🤖",
                    description: 'Por medio de esta invitación alguien podrá unirse a Virtual UCU.\n¡ Recuerda que el tiempo límite es de 1 hora !',
                    fields:[ {
                        name: 'Vínculo',
                        value: 'discord.gg/' + invite.code,
                        inline: true
                    }]
                }
            ))
        }, 
        (err) => console.log(err))
    client.guilds.cache.get(ID.SERVER_ID).fetchInvites().then(
        (invites) => {Data.cache_invites = invites}, 
        (err) => {console.log(err)}
    )
}

class temporal_membership {
    constructor(code, creator){
        this.creator = creator
        this.code = code
        this.start_date = undefined
    }
}  

exports.guestHandler = guestHandler
exports.cancelmessage = sendCancelationMessage
exports.subscribeHandler = subscribeHandler
exports.helpHanlder = helpHanlder
exports.requestEventData = requestEventData
