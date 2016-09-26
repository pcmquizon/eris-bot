/*
Skuld : Simple Taskbot
Created by: Jaime R. Canicula

Thanks to Pia Carmela Quizon for helping me on the LUIS
and brushing up with node.js

References : https://docs.botframework.com/en-us/node/builder/guides/examples/
           : https://docs.botframework.com/en-us/node/builder/

           + session.message.address.user.id = for deployment unique id
           + session.message.address.user.name = unique name;
*/

var restify = require('restify');
var builder = require('botbuilder');
var chrono = require('chrono-node');


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    //appId: 'fac1b10a-47f8-4da8-853d-f694ce0a4ec6',
    //appPassword: 'cGkmy5TqALJkVhV3DoxgdzO'

    appId: '',
    appPassword: '' 
});

var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
var intents = new builder.IntentDialog();

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=f5eda0a2-2df1-492c-814b-3382dd4d0303&subscription-key=fa7154d93dae4d8196750dc6f1de0201');

var intents = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);


/*Intent Matching*/

//===============================================
//Creating a tasks
// Added : September 26, 2016
//===============================================||
intents.matches('createtasks', [

    function(session,args,next,req,res){
        /*Initialize the user session*/
        session.userData.newConversation = "initialized";

        /*Store the luis entites to the session to be used in the waterfall*/
        session.userData.entities = args.entities;


        /*Taks Name Definition*/
        var taskName = builder.EntityRecognizer.findEntity(session.userData.entities,'taskname');


        if(taskName){
            /*if there is a taskName store it to the session.userData*/
            session.userData.taskName = taskName.entity;
            next();
        }
        /*Create a new dialog if taskName Is Missing*/
        else{

            session.beginDialog('/missingTaskName',{
                prompt: "Seems Like there is no task name. What is the name of your tasks?",
                retryPrompt: "Sorry that's incorrect. It must not be empty"
            });
        }

    },
    function (session, results,next,res,req) {

        /*Just for the prompting*/

        if(!session.userData.taskName){
            if (results.response) {
                session.userData.taskName = results.response;
                session.send("Task name is set to %s",results.response);
            } else {
                session.send("too many tries");
            }
        }

        /*waterfall*/

        next();
    },

    function(session,args,next){

        var scheduletype = builder.EntityRecognizer.findEntity(session.userData.entities,'scheduletype');

        if(scheduletype){
            // session.send("Got Task Type");
            session.userData.taskType = scheduletype.entity;
            next();
        }
        else{

            session.beginDialog('/missingTaskType',{
                prompt: "Seems Like there is no task type. Kindly input it",
                retryPrompt: "Sorry that's incorrect. It must not be empty"
            });

        }
    },

     function (session, results,next,args) {
        // Check their answer
        if(!session.userData.taskType){
            if (results.response) {
                session.userData.taskType = results.response;
                session.send("Your Task type is set to %s", results.response);
            }
            else {
                session.send("too many tries for taskType");
            }
        }
         next();
    },

    function(session,args,next,req,res){

        var scheduleDate = builder.EntityRecognizer.findEntity(session.userData.entities,'builtin.datetime.date');

        var scheduleDateSpecial = builder.EntityRecognizer.findEntity(session.userData.entities,'date.times');
       
        var todaysDate = chrono.parseDate('today');
       
        /*to be put in a function*/
        if(scheduleDate){
            
            var inputDate = chrono.parseDate(scheduleDate.entity);

            if(new Date (inputDate) >= new Date(todaysDate)){
                    var valid = true;
            }
        }
        
        else if(scheduleDateSpecial){
            var inputDateSpecial = chrono.parseDate(scheduleDateSpecial.entity);
      
            if(new Date (inputDateSpecial) >= new Date(todaysDate)){
                var valid = true;

            }
        } 

        if(scheduleDate && valid){
            session.userData.taskDate = scheduleDate.entity;
            var x = chrono.parseDate(scheduleDate.entity);
            session.userData.taskDate = x;
            next();
        }
        else if(scheduleDateSpecial && valid){
            //session.userData.taskDate =  chrono.parseDate(scheduleDateSpecial); 
            var x = chrono.parseDate(scheduleDateSpecial.entity);
            session.userData.taskDate = x;
            next();
        }
        else{
            session.beginDialog('/missingRecipient',{
                prompt: "Seems like I can't see your date or your date is not . What's the schedule's date?",
                retryPrompt: "Sorry that is incorrect. Enter a better format."
            });
        }
    },

    function(session,results,next,args){

        if(!session.userData.taskDate){
            if (results.response) {
                var y = chrono.parseDate(results.response);
                var t = chrono.parseDate('today');
             //console.log("Hello world");
             //console.log("Input: " + new Date(y)); 
             //console.log("Today: " + new Date(t));
                if(new Date(y) >= new Date(t)){
                    console.log(new Date(y) > Date(t));
                    //console.log("Your Input:" + new Date(y));
                    //console.log("Today:" + new Date(t));
                    session.userData.taskDate = new Date(y);
                 }

                 else{
                    session.send ("Invalid date");
                 }
            } 
            else {
                session.userData.invalid = true;
                session.send('To many tries. This will now be invalid');
            }
        }

        next();
    },


    function(session,args,next,req,res){

        var schedulePlace = builder.EntityRecognizer.findEntity(session.userData.entities,'place');

        if(session.userData.invalid){

            next();
        }
        else if(schedulePlace){
            session.userData.taskPlace = schedulePlace.entity;
            next();
        }
        else{
            session.beginDialog('/missingTaskPlace',{
                prompt: "Seems Like there is no place. Where will this be happening?",
                retryPrompt: "Sorry that is incorrect."
            });
        }
    },

    function(session,results,next,args){

        if(!session.userData.taskPlace){
            if (results.response) {
                session.userData.taskPlace = results.response;
                session.send("Place is set to %s", results.response);
            }
            else {
                session.send("too many tries for taskPlace");
            }
        }
         next();

    },

    function(session,args,next){

        session.send("Task name: %s, TaskType %s, taskDate %s, task place %s", session.userData.taskName,  session.userData.taskType, session.userData.taskDate, session.userData.taskPlace)
        /*can be a function for reusablitiy function(session){ session.something}*/
        
        if(session.userData.taskName &&  session.userData.taskDate && session.userData.taskType && !session.userData.invalid){
                session.beginDialog('/deleteResponse',{
                prompt: "Are you sure you wanna schedule it? (Yes /or anything if No)",
                retryPrompt: "Sorry that is incorrect. Enter a better format"
            });
        }

        else{
            session.userData.taskName = null;
            session.userData.taskType = null;
            session.userData.taskDate = null;
            session.userData.entities = null;
            session.userData.taskPlace = null;
            session.userData.invalid = null;
            session.send("Invalid query");
        }
    },

    function(session,results,args){
        if(!session.userData.createResponse){
            if (results.response) {
                session.userData.createResponse = results.response;
                if(results.response ==="Yes" || results.response ==="yes") {
                    
                    //call db insert//
                    session.send("Sucessfully Added");
                }
                else{

                    session.send("You Cancelled!");
                }
            }
            else {
                session.send("Oh no! There's an errrror!");
            }
        }

        session.userData.taskName = null;
        session.userData.taskType = null;
        session.userData.taskDate = null;
        session.userData.entities = null;
        session.userData.taskPlace = null;
        session.userData.invalid = null;
        session.userData.createResponse = null;
        
    }
]);


intents.matches('deletetasks', [

    function(session,args,next,req,res){
        /*Initialize the user session*/
        session.userData.newConversation = "initialized";

        /*Store the luis entites to the session to be used in the waterfall*/
        session.userData.entities = args.entities;

        /*Taks Name Definition*/
        var deleteTaskName = builder.EntityRecognizer.findEntity(session.userData.entities,'taskname');
        var deleteTaskall = builder.EntityRecognizer.findEntity(session.userData.entities,'all');

        if(deleteTaskName){
            /*if there is a taskName store it to the session.userData*/
            session.userData.deleteTaskName = deleteTaskName.entity;
            if(deleteTaskall){
                session.userData.deleteAllTask= deleteTaskall.entity;
                session.send(session.userData.deleteTaskall + " DELETE ALL SOMETHING INVOKED");
            }
           
            next();
        }
        /*Create a new dialog if deleteTaskName Is Missing*/
        else{
            if(deleteTaskall){
                next(); 
                session.userData.deleteAllTask = deleteTaskall.entity;
            }
            else{
                session.beginDialog('/missingDeleteTaskName',{
                    prompt: "Seems Like I can't see the task to be deleted in your query, would you enter the name of the task to be deleted?",
                    retryPrompt: "Sorry that's incorrect. It must not be empty"
                });
            }
        }
    },

    function (session,results,next,res,req) {
        /*Just for the prompting*/
        if(!session.userData.deleteTaskName && !session.userData.deleteTaskall){
            if (results.response) {
                session.userData.deleteTaskName = results.response;
                session.send("Task name to delete is set to %s", results.response);
            } else {
                session.send("too many tries");
            }
        }
        /*waterfall*/
        next();
    },


    function(session,args,next,req,res){


        var deleteScheduleDate = builder.EntityRecognizer.findEntity(session.userData.entities,'builtin.datetime.date');

        var deleteScheduleSpecial = builder.EntityRecognizer.findEntity(session.userData.entities,'date.times');
       
        var todaysDate = chrono.parseDate('today');
       
        if(deleteScheduleDate){
            
            var inputDate = chrono.parseDate(deleteScheduleDate.entity);

            if(new Date (inputDate) >= new Date(todaysDate)){
                    var valid = true;
            }
        }
        
        else if(deleteScheduleSpecial){
            var inputDateSpecial = chrono.parseDate(deleteScheduleSpecial.entity);
      
            if(new Date (inputDateSpecial) >= new Date(todaysDate)){
                var valid = true;
            }
        } 

        if(deleteScheduleDate && valid){
            session.userData.deleteTaskDate = scheduleDate.entity;
            var x = chrono.parseDate(scheduleDate.entity);
            session.userData.deleteTaskDate = x;
            next();
        }
        else if(deleteScheduleSpecial && valid){
            //session.userData.deleteTaskDate =  chrono.parseDate(scheduleDateSpecial); 
            var x = chrono.parseDate(scheduleDateSpecial.entity);
            session.userData.deleteTaskDate = x;
            next();
        }

        /*
        if(deleteScheduleDate){

            var x = chrono.parse(deleteScheduleDate.entity);
            session.userData.deleteTaskDate = x;
            session.send(x + "Deletion Date");
            
            next();
        }
        else if(deleteScheduleSpecial){

            var x = chrono.parse(deleteScheduleDate.entity);
            session.userData.deleteTaskDate = x;
            session.send(x + "Deletion Date");
            
        }
        */
        else{
            session.beginDialog('/missingDeleteTaskDate',{
                prompt: "Seems like there is no date or the date you entered is in the past. Don't look back. When is the date of the task?",
                retryPrompt: "Sorry that is incorrect. Enter a better format"
            });
        }
    },

    function(session,results,next,args){

        if(!session.userData.deleteTaskDate){
            if (results.response) {
                var y = chrono.parseDate(results.response);
                var t = chrono.parseDate('today');
             //console.log("Hello world");
             //console.log("Input: " + new Date(y)); 
             //console.log("Today: " + new Date(t));
                if(new Date(y) >= new Date(t)){
                    console.log(new Date(y) > Date(t));
                    //console.log("Your Input:" + new Date(y));
                    //console.log("Today:" + new Date(t));
                    session.userData.deleteTaskDate = new Date(y);
                 }

                 else{
                    session.send ("Invalid date");
                 }
            } 
            else {
                session.userData.invalid = true;
                session.send('To many tries. This will now be invalid');
            }
        }
         next();

    },


    function(session,args,next,req,res){


        session.send("Task name to delete: %s, taskDate: %s", session.userData.deleteTaskName,  session.userData.deleteTaskDate);
        /*can be a function for reusablitiy function(session){ session.something}*/
        if(session.userData.deleteTaskName &&  session.userData.deleteTaskDate && !session.userData.invalid){
                session.beginDialog('/deleteResponse',{
                prompt: "Do you wanna delete it? (Yes/No)",
                retryPrompt: "Sorry that is incorrect. Enter a better format"
            });
        }

        /* yung all na cases
        else if {

            next()
        }
        */

        else{     
            
            session.send("Query Invalid");   
            session.userData.deleteTaskName = null;
            session.userData.deleteTaskDate = null;
            session.userData.entities = null;
            session.userData.all = null;
            session.userData.deleteResponse = null;
            session.userData.invalid  = null;
     
        }
    },
     function(session,results,args){
        if(!session.userData.deleteResponse){
            if (results.response) {
                session.userData.deleteResponse = results.response;
                if(results.response ==="Yes" || results.response ==="yes") {
                    
                    //call db delete//
                    session.send("Task deleted");
                }
                else{
                    session.send("Task deletion cancelled");
                }
            }
            else {
                session.send("Something went wrong dude!");
            }
        }
        session.userData.deleteTaskName = null;
        session.userData.deleteTaskDate = null;
        session.userData.entities = null;
        session.userData.all = null;
        session.userData.deleteResponse = null;
        session.userData.invalid  = null;
    }
]);


intents.matches('showtasks', [

    function(session,args,next,req,res){
        /*Initialize the user session*/
        session.userData.newConversation = "initialized";

        /*Store the luis entites to the session to be used in the waterfall*/
        session.userData.entities = args.entities;

        /*Taks Name Definition*/
        var listTaskName = builder.EntityRecognizer.findEntity(session.userData.entities,'taskname');

        if(listTaskName){
            /*if there is a taskName store it to the session.userData*/
            session.userData.listTaskName = listTaskName.entity;
            next();
        }
        /*Create a new dialog if listTaskName Is Missing*/
        else{

            session.beginDialog('/missingListTaskName',{
                prompt: "Seems Like I can't see the taskname, would you enter the name of the task to be listed?",
                retryPrompt: "Sorry that's incorrect. It must not be empty"
            });
        }

    },

    function (session, results,next,res,req) {

        /*Just for the prompting*/
        if(!session.userData.listTaskName){
            if (results.response) {
                session.userData.listTaskName = results.response;
                session.send("Task name to list is set to %s", results.response);
            } else {
                session.send("too many tries");
            }
        }

        /*waterfall*/

        next();
    },


    function(session,args,next,req,res){

        var listScheduleDate = builder.EntityRecognizer.findEntity(session.userData.entities,'builtin.datetime.date');

        if(listScheduleDate){
            session.userData.listTaskDate = listScheduleDate.entity;
            next();
        }
        else{
            session.beginDialog('/missingListTaskDate',{
                prompt: "Seems Like there is no date. When is the date of the task?",
                retryPrompt: "Sorry that is incorrect."
            });
        }
    },

    function(session,results,next,args){

        if(!session.userData.listTaskDate){
            if (results.response) {
                session.userData.listTaskDate = results.response;
                session.send("taskDate is set to %s", results.response);
            }
            else {
                session.send("too many tries for taskDate");
            }
        }
         next();

    },


    function(session,args){

        session.send("Task name to list: %s, taskDate: %s", session.userData.listTaskName,  session.userData.listTaskDate);

        /*can be a function for reusablitiy function(session){ session.something}*/
        session.userData.listTaskName = null;
        // session.userData.taskType = null;
        session.userData.listTaskDate = null;
        session.userData.entities = null;
        // session.userData.taskPlace = null;

    }

]);

intents.onDefault([
    function (session, args) {
        if(!session.userData.newConversation){
            session.beginDialog('/welcome');
            session.send("Thanks for using the bot on " + session.message.address.channelId + " Let\'s set your future!");
        }
        else{
            session.beginDialog('/cannot');
        }
    }
]);

bot.dialog('/welcome', [
    function (session) {
        session.send('Hi! ' +session.message.address.user.name+'! This is Skuld, Your Personal Scheduling Bot! Currently, I\'m for training!');
        session.userData.newConversation = "initialized";
        session.endDialog();
    }
]);

bot.dialog('/cannot',[
    function(session){
        session.send('I cannot understand what you are saying! I\'m still learning. Teach me! ');
        session.endDialog();
    }
]);

bot.dialog('/missingTaskName', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingRecipient', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    
   var inputDate = chrono.parseDate(response);
   var todaysDate = chrono.parseDate('today');

   if(new Date (inputDate) >= new Date(todaysDate)){
        var valid = true;
   }

    return response !== null && chrono.parseDate(response) && valid;
}));

bot.dialog('/missingTaskType', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingTaskPlace', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingDeleteTaskName', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {

    return response !== null;
}));

bot.dialog('/missingDeleteTaskDate', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {

   var inputDate = chrono.parseDate(response);
   var todaysDate = chrono.parseDate('today');

   if(new Date (inputDate) >= new Date(todaysDate)){
        var valid = true;
   }

    return response !== null && chrono.parseDate(response) && valid;
}));

bot.dialog('/missingListTaskName', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingListTaskDate', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));


bot.dialog('/deleteResponse', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response == "Yes" || response == "No" || response == "yes" || response == "no";
}));

//=========================================================
// MS SQL
//=========================================================

// var sql = require('mssql');

// var config = {
//     user: 'skuld',
//     password: '!July2016',
//     server: 'skuld.database.windows.net',
//     database: 'Skuld',

//     options: {
//         encrypt: true // For Windows Azure
//     }
// }

// sql.connect(config, function(err) {
//     // ... error checks
//     if(err){
//         console.log('CONNECTION error: '+err);
//     }

//     var request = new sql.Request();

//     //=========================================================
//     // apparently MS SQL *hates* double quotes,
//     // this applies to all operations (select, update, delete), not just insert

//     // for each string you will use, escape the single quotes you'll be using
//     // e.g. insert into table_name(table_column) values(\'some value\');'

//     // another option is to use variables in this format:
//     //  var foo = "'some value'";
//     // then use it in the query string like this
//     //  'insert into table_name(table_column) values('+ foo +');'
//     //=========================================================

//     // create / insert
//     request.query('insert into Tasks(TaskName) values(\'test insert\');', function(err, recordset) {
//         // ... error checks
//         if(err){
//             console.log('DB error: '+err);
//         }

//         console.log(recordset);
//     });


//     // retrieve / select
//     request.query('select * from TrainingData', function(err, recordset) {
//         // ... error checks
//         if(err){
//             console.log('DB error: '+err);
//         }

//         console.log(recordset);
//     });


//     // update
//     request.query('update Tasks set TaskName=\'test update\' where TaskName=\'modified_jaime3\'', function(err, recordset) {
//         // ... error checks
//         if(err){
//             console.log('DB error: '+err);
//         }

//         console.log(recordset);
//     });


//     // delete
//     request.query('delete from Tasks where TaskName=\'jaime\'', function(err, recordset) {
//         // ... error checks
//         if(err){
//             console.log('DB error: '+err);
//         }

//         console.log(recordset);
//     });

// });
