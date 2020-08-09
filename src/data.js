const ID = require('./server_constants')
const Human = require('./human')
const main = require('./main')
const Datastore = require('nedb')

// Build up all needed structures in order to start working 
const events = []
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
} 

function addSubscriber(sub, success, err){
  isSubscriber(sub.sub_dm_id, function(){ 
    calendar_subscribers.insert(sub) 
    success
  }, err) 
}

function isSubscriber(sub_id, success, error){
  calendar_subscribers.findOne({ sub_dm_id: sub_id }, (err, doc) => { console.log(doc)
    if (doc != null) {
      error()
    } else {
      success
    }})
}

exports.cache_invites = cache_invites
exports.invites = invites
exports.events = events
exports.calendar_subscribers = calendar_subscribers
exports.humans = humans
exports.loadMembersinfo = loadMembersinfo
exports.addSubscriber = addSubscriber
exports.isSubscriber = isSubscriber
exports.initializeData = initializeData
