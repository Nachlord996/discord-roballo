const Discord = require('discord.js');
const Data = require('./data') 

var count = 0

class calendar_event {

    constructor(title, date, description) {
        this.event_id = count++
        this.event_title = title
        this.event_date = date
        this.event_description = description
        this.days_to_announce = 0
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

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

exports.eventsCheck = eventsCheck
exports.calendar_event = calendar_event