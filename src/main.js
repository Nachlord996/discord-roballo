const Discord = require('discord.js');
const client = new Discord.Client();
const Scheduler = require('node-schedule');
const Human = require('./human.js');
const ID = require('./server_constants.js')
const { calendar_event } = require('./event.js')
const fs = require('fs');

let secret = fs.readFileSync('secret.json');
let token = JSON.parse(secret).token;
const init_promise = client.login(token);
init_promise.then(initializeServer, (reason => console.log(reason)))

// Build up all needed structures in order to start working 
const events = []
const calendar_subscribers = []
const humans = []

function loadMembersinfo() {
  client.guilds.cache.get(ID.SERVER_ID).members.fetch().then(
    (success) => {
      var mems = client.guilds.cache.get(ID.SERVER_ID).members.cache
      if (mems != undefined) {
        mems.forEach((member) => {
          humans.push(new Human.Human(member.user.username, member.id))
        })
      }
    }
    , (reason) => console.log(reason))
}

function initializeServer() {

  console.log('Building up server, this may take a while...')
  var rule = new Scheduler.RecurrenceRule();
  const now = new Date(Date.now());
  rule.hour = now.getHours();
  rule.minute = now.getMinutes() + 1;
  Scheduler.scheduleJob(rule, eventsCheck)
  console.log('Events report schedule has been set successfully')

  loadMembersinfo()

  // Middleware for upcoming messages
  client.on('message', (message) => { if (!IsbotMessage(message)) { if (message.channel.type === 'dm') { manageDMs(message) } else { manageServerMessage(message) } } })
  console.log('Server is up, bot commands are now available!')
}

function requestEventData(message, human) {
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
      var ev_description =  human.requestData.event_description
      events.push(new calendar_event(ev_title, ev_description, parsedDate))

      Scheduler.scheduleJob(new Date(parsedDate), () => {
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
      }
      )

      return true;
    default:
      break;
  }
}

// Start scheduling daily event checker 
function eventsCheck() {
  // Read events and send messages to discord channel 
  // Connect to DB and load events

  // Send a message for each event
  var channel = client.channels.cache.get(ID.ANNOUNCEMENTS_CHANNEL_ID);

  for (ev of events) {
    console.log('Iterating over events: Item ' + ev.event_title)
    // Check that all events reported haven't ocurred yet
    var evdate = new Date(ev.event_date)
    var today = new Date(Date.now())

    if ((addDays(today, ev.days_to_announce) < evdate) && (evdate < addDays(today, ev.days_to_announce + 1))) {
      console.log(`The event ${ev.event_id} should be announced today!`)

      // Build up event message

      var event_message = new Discord.MessageEmbed({
        color: '#2d37a6',
        title: "⏳¡ Un evento se aproxima ! ⏳",
        description: '¿Tú también puedes sentirlo? ¡ Mi radar nunca se equivoca !\n\n',
        fields: [
          {
            name: 'Título',
            value: ev.event_title,
            inline: true
          },
          {
            name: 'Fecha',
            value: evdate.getUTCDate() + '/' + (evdate.getUTCMonth() + 1) + '/' + evdate.getUTCFullYear() + " " + evdate.getHours() + ":" + evdate.getMinutes(),
            inline: true
          },
          {
            name: 'Descripción',
            value: ev.event_description
          }
        ]
      })

      // Send Discord message to announcements channel
      channel.send(event_message).catch((error) => { console.log(`No se pudo enviar notificación por canal: ${channel.name}`) })

      // Send message to suscribers!
      for (sub of calendar_subscribers) {
        var sub_account = client.guilds.cache.get(ID.SERVER_ID).members.cache.get(sub.sub_dm_id)
        if (sub != null) {
          sub_account.send(event_message)
        }
      }
    }
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
  var isSubscriber = calendar_subscribers.find((value) => { return value.sub_dm_id === message.author.id })
  if (!isSubscriber) {
    calendar_subscribers.push({
      sub_id: calendar_subscribers.length,
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

function manageDMs(message) {

  var message_sender = humans.find((human) => { return human.dm_id === message.author.id })
  if (message_sender != undefined) {
    switch (message_sender.state) {
      case ID.talking_states.IDLE:
        if (message.content.startsWith('!')) {
          var cmd = message.content.split(" ")
          switch (cmd[0]) {
            case '!subscribe':
              if (cmd.length == 1) {
                subscribeHandler(message)
              }
              break;
            case '!help':
              if (cmd.length == 1) {
                helpHanlder(message, true)
              }
              break;
            case '!event':
              if (cmd.length == 1) {
                message_sender.state = ID.talking_states.WAITING
                message_sender.requestState = 0
                message_sender.chatHandler = requestEventData
                requestEventData(message, message_sender)
              }
            default:
              break;
          }
        }
        break;
      case ID.talking_states.WAITING:
        if (message.content === '!cancel') {
          message_sender.state = ID.talking_states.IDLE
          sendCancelationMessage(message_sender)
        } else {
          if (message_sender.chatHandler(message, message_sender)) {

          }
        }
      default:
        break;
    }
  }
}

function sendCancelationMessage(sender) {
  var sub_account = client.guilds.cache.get(ID.SERVER_ID).members.cache.get(sender.dm_id)
  sub_account.send(new Discord.MessageEmbed({
    color: '#2d37a6',
    title: "🤖 ¡ Te estaré esperando ! 🤖",
    description: 'La cancelación se ha realizado con éxito, vuelve cuando quieras.'
  }))
}

function manageServerMessage(message) {

  if (message.content.startsWith('!')) {
    var cmd = message.content.split(" ")

    switch (cmd[0]) {
      case '!help':
        if (cmd.length === 1) {
          helpHanlder(message, false);
        }
        break;
      default:
    }
  }
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function IsbotMessage(message) { return message.author.id === ID.ROBALLO_HEIR_ID }


