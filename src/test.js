const Scheduler = require('node-schedule');

var parsedDate = Date.parse('08/03/2020 21:16')
console.log(parsedDate)
console.log(new Date(parsedDate))

console.log(Scheduler.scheduleJob(new Date(parsedDate), function(){console.log('hola')}).nextInvocation())