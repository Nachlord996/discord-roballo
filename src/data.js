const ID = require('./server_constants')
const Human = require('./human')
const main = require('./main')

// Build up all needed structures in order to start working 
const events = []
const calendar_subscribers = []
const humans = []
const invites = []
const cache_invites = {}

function loadMembersinfo() {
  main.client.guilds.cache.get(ID.SERVER_ID).members.fetch().then(
    (success) => {
      var mems = main.client.guilds.cache.get(ID.SERVER_ID).members.cache
      if (mems != undefined) {
        mems.forEach((member) => {
          humans.push(new Human.Human(member.user.username, member.id))
        })
      }
    }
    , (reason) => console.log(reason))
}

exports.cache_invites = cache_invites
exports.invites = invites
exports.events = events
exports.calendar_subscribers = calendar_subscribers
exports.humans = humans
exports.loadMembersinfo = loadMembersinfo
