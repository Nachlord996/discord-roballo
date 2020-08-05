
var count = 0

class calendar_event {
    
    constructor(title, date, description){
        this.event_id = count++
        this.event_title = title
        this.event_date = date
        this.event_description = description
        this.days_to_announce = 0
    }
   
}

exports.calendar_event = calendar_event