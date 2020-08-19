const { talking_states } = require('./server_constants') 

class Human {
    constructor(nickname, dm_id){
        this.nickname = nickname
        this.dm_id = dm_id
        this.state = talking_states.IDLE
        this.chatHandler = undefined 
    }
}

class Guest {
    constructor(nickname, dm_id, admission, expulsion){
        this.nickname = nickname
        this.dm_id = dm_id 
        this.admission = admission
        this.expulsion = expulsion
    }
}
exports.Human = Human
exports.Guest = Guest
