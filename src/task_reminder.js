const Discord = require('discord.js');
const client = new Discord.Client();
const ID = require('./server_constants')

const init_promise = client.login("NjkzOTAyMDc5MTk4MTAxNjE0.XoD0qw.azEM_RLBjrk8GDWFBNNC0h3vjGQ");

init_promise.then(() => {
    client.guilds.cache.get(ID.SERVER_ID).fetch().then((guild) => {
        var recevier_channel = guild.channels.cache.get(ID.MAIN_CHANNEL_ID)

        var message = new Discord.MessageEmbed({
            title: '🤖 ¡ Para que no te olvides ! 🤖',
            description: 'Mis radares detectaron un correo electrónico con una tarea para ti.',
            fields: [ 
                {
                    name: 'Asignatura',
                    value: 'Ingeniería de Software II'
                }, {
                    name: 'Tarea',
                    value: '🔸 Entrar al link de google docs\n🔸 Agregar nombre, correo de zoom y correo de webasignatura'
                },{
                    name:'Acceso',
                    value: 'https://docs.google.com/spreadsheets/d/1va9N4zVNrpaucQili-GJUnXXQ4H8u0rrREBs5NAcdLQ/edit?usp=sharing'
                }
        ]
        })
    
        recevier_channel.send(message)


    })
   
})

