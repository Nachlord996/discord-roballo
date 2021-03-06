const ID = require('./server_constants')
const Human = require('./human')
const main = require('./main')
const Datastore = require('nedb')

// Build up all needed structures in order to start working 
const events = new Datastore('events.db')
const calendar_subscribers = new Datastore('calendar_subscribers.db')
const guests = new Datastore('guests.db')
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

function fetchGuestMemberships(client, scheduler){
  var pendingKick = (docs) => {
    success(docs, (member, g_mem) => {
        scheduler.scheduleJob(new Date(g_mem.expulsion), function (member) {
        member.kick() }.bind(null, member))
    }
    )
  }

  var success = (docs, action) => {
    if (docs.length > 0) {
      for (g_member of docs){ 
          client.guilds.cache.get(ID.SERVER_ID).members.fetch().then((members) => {
          var member = members.get(g_member.id)
          if (member != undefined) {
            action(member, g_member)    
              }
          })     
      }
    }
  } 

  mapGuests({ expulsion: { $gt: Date.now() }}, pendingKick, () => console.log('Error related to database guests'))
}

function initializeData(){
  calendar_subscribers.loadDatabase()
  events.loadDatabase()
  guests.loadDatabase()
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
  map(events, query, f_apply, err)
}

function mapGuests(query, f_apply, err){
  map(guests, query, f_apply, err)
}

function map(db, query, f_apply, f_err){
  db.find(query, (error, docs) => { docs != null ? f_apply(docs) : f_err()} )
}

function addGuest(nick, id, admission, expulsion){
    guests.insert(new Human.Guest(nick, id, admission, expulsion))
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
exports.mapGuests = mapGuests
exports.addGuest = addGuest
exports.fetchGuestMemberships = fetchGuestMemberships
exports.initializeData = initializeData
