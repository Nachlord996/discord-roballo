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
            var ev = new calendar_event(ev_title, parsedDate, ev_description)
            
            Data.addEvent(ev)

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

}

function subscribeHandler(message) {
    var success = new Discord.MessageEmbed({
        title: '🤖 Suscripción exitosa 🤖',
        color: '#2d37a6',
        description: "¡ Que alegría, un nuevo suscriptor ! Un placer servirte " + '<@' + message.author.id + '>' + "\n\nRecuerda que siempre puedes dejar de recibir mensajes con el comando \n🔻 `!unsubscribe`"
    })

    var error = new Discord.MessageEmbed({
        title: '🤖 Tómalo con calma... 🤖',
        color: '#2d37a6',
        description: "\n¡ Ya eres parte de los suscriptores, puedes esperar tranquilamente !"
    })

    // Fetch database and query for suscriber. Then add it
    Data.addSubscriber({ sub_dm_id: message.author.id }, function() {message.channel.send(success) }, function() {message.channel.send(error) })
}

function sendCancelationMessage(client, sender) {
    var sub_account = client.guilds.cache.get(ID.SERVER_ID).members.cache.get(sender.dm_id)
    sub_account.send(new Discord.MessageEmbed({
        color: '#2d37a6',
        title: "🤖 ¡ Te estaré esperando ! 🤖",
        description: 'La cancelación se ha realizado con éxito, vuelve cuando quieras.'
    }))
}

function guestHandler(client, message) {
    var inviter = message.author.id
    client.guilds.cache.get(ID.SERVER_ID).members.fetch().then((members) => {
        var member = members.get(inviter)
        if (member != undefined) {
            var founder = member.roles.cache.find(o => o.name === 'Founder')
            if (founder == undefined){
                message.channel.send(new Discord.MessageEmbed(
                    {
                        color: '#2d37a6',
                        title: "⛔ Acceso Denegado ⛔",
                        description: 'Has intentado solicitar una membresía pero no tienes los permisos para realizarlo.\nPonte en contacto con el administrador del servidor.'
                    }
                ))
                return
            }
        client.guilds.cache.get(ID.SERVER_ID).channels.cache.get(ID.MAIN_CHANNEL_ID).createInvite({ unique: true, maxAge: 300 })
            .then(
                (invite) => {
                    var temporal = new temporal_membership(invite.code, message.author.id)
                    Data.invites.push(temporal)
                    message.channel.send(new Discord.MessageEmbed(
                        {
                            color: '#2d37a6',
                            title: "🤖 ¡ Tenemos un nuevo invitado ! 🤖",
                            description: 'Por medio de esta invitación alguien podrá unirse a Virtual UCU.\n¡ Recuerda que el tiempo límite es de 2 horas !',
                            fields: [{
                                name: 'Vínculo',
                                value: 'discord.gg/' + invite.code,
                                inline: true
                            }]
                        }
                    ))
                    
                    client.guilds.cache.get(ID.SERVER_ID).fetchInvites().then(
                        (invites) => { Data.cache_invites = invites },
                        (err) => { console.log(err) }
                    )
                },
                (err) => console.log(err))
            }
    
    }, (err) => console.log(err))
    
}

function timeleftHandler(client, message){
    var success = (docs) => {
        var response
        if (docs.length == 0){
            response = new Discord.MessageEmbed({
                title: '💺 Algunas sillas vacías... 💺',
                color: '#F25C05',
                description: 'En este momento no tenemos invitados en el servidor.\nRecuerda que puedes invitar personas con el comando `!guest`'
            })
        } else {
            
            var members = ''
            var t_left = ''
            for (guest of docs){
            
                members += guest.nickname + '\n'
                var admission = new Date(Date.now())
                var expulsion = new Date(guest.expulsion)
                timeleft_min = Math.floor((expulsion - admission) / 60000)
                if (timeleft_min > 60){
                    timeleft_hour = (timeleft_min / 60) >> 0
                    timeleft_min = timeleft_min % 60
                } else { 
                    timeleft_hour = 0
                }
                line = timeleft_hour + 'h ' + timeleft_min + 'm'
                t_left += line + '\n'
            }
            response = new Discord.MessageEmbed({
                title: '⌚️ ¡ El tiempo vuela ! ⌚️',
                color: '#2d37a6',
                description: 'Terminé mis reportes, estos son los resultados:',
                fields: [
                    {
                        name: 'Miembro',
                        value: members,
                        inline: true
                    },
                    {
                        name: 'Tiempo restante',
                        value: t_left,
                        inline: true
                    }
                ]
            })
        }
        message.channel.send(response)
    }
    Data.mapGuests({ }, success, () => console.log('Error related to database guests'))
}

function weekTasksHandler(client, message){

    var success = (docs) => {
        var events = ""
        var count = 0
        if (docs.length == 0) {
            message.channel.send(new Discord.MessageEmbed({
                title: '🤖 ¡ Nada para hacer ! 🤖',
                color: '#2d37a6',
                description: 'Por el momento estás libre, tómalo con calma.\nEsta vez invito yo ! 🍺'
            })

            )
            return;   
        }
        docs.forEach(element => {
            var evdate = new Date(element.event_date)
            count++
        events += "🔸 " + evdate.getUTCDate() + '/' + (evdate.getUTCMonth() + 1) + '/' + evdate.getUTCFullYear() +  " - " + element.event_title + "\n"
        });

        message.channel.send(new Discord.MessageEmbed({
            title: '🤖 ¡ Tareas para la semana ! 🤖',
            color: '#2d37a6',
            fields: [
                {
                    name: 'Cantidad',
                    value: count,
                }
            ],
            description: "Según mis registros, esta es tu información para la semana:\n\n" + events + "\n"
        }))
    }

    Data.mapEvents({ $and: [ {"event_date": { $lt : Date.now() + (1000 * 3600 * 24 * 7) } }, { "event_date" : { $gt : Date.now() } }] }, success, () => console.log("Error related to events db"))
}

class temporal_membership {
    constructor(code, creator) {
        this.creator = creator
        this.code = code
        this.start_date = undefined
    }
}


exports.guestHandler = guestHandler
exports.cancelmessage = sendCancelationMessage
exports.subscribeHandler = subscribeHandler
exports.helpHanlder = helpHanlder
exports.weekTasksHandler = weekTasksHandler
exports.timeleftHandler = timeleftHandler
exports.requestEventData = requestEventData
