const ID = require('./server_constants')
const Human = require('./human')
const main = require('./main')
const Datastore = require('nedb')

// Build up all needed structures in order to start working 
const events = new Datastore('events.db')
const calendar_subscribers = new Datastore('calendar_subscribers.db')
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

function initializeData(){
  calendar_subscribers.loadDatabase()
  events.loadDatabase()
} 

function addSubscriber(sub, success, err){
  isSubscriber(sub.sub_dm_id, err, () => { 
    calendar_subscribers.insert(sub) 
    success() 
  }) 
}

function isSubscriber(sub_id, success, error){
  calendar_subscribers.findOne({ sub_dm_id: sub_id }, (err, doc) => { doc != null ? success() : error() })
}

function addEvent(event){
  events.insert(event)
}

function mapEvents(query, f_apply, err){
  events.find(query, (error, docs) => {
    console.log(docs)
  docs != null ? f_apply(docs) : err()

})
}

exports.cache_invites = cache_invites
exports.invites = invites
exports.events = events
exports.calendar_subscribers = calendar_subscribers
exports.humans = humans
exports.loadMembersinfo = loadMembersinfo
exports.addSubscriber = addSubscriber
exports.isSubscriber = isSubscriber
exports.addEvent = addEvent
exports.mapEvents = mapEvents
exports.initializeData = initializeData
