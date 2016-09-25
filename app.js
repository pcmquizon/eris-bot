/*
Skuld : Simple Taskbot
Created by: Jaime R. Canicula

Thanks to Pia Carmela Quizon for helping me on the LUIS
and the concept of Node.js

References : https://docs.botframework.com/en-us/node/builder/guides/examples/
           : https://docs.botframework.com/en-us/node/builder/
*/
var restify = require('restify');
var builder = require('botbuilder');

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
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
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
                prompt: "Seems Like there is no task type. Who is the name of your tasks?",
                retryPrompt: "Sorry that's incorrect. It must not be empty"
            });

        }
    },

     function (session, results,next,args) {
        // Check their answer
        if(!session.userData.taskType){
            if (results.response) {
                session.userData.taskType = results.response;
                session.send("taskType is set to %s",results.response);
            }
            else {
                session.send("too many tries for taskType");
            }
        }
         next();
    },

    function(session,args,next,req,res){

        var scheduleDate = builder.EntityRecognizer.findEntity(session.userData.entities,'recipient');

        if(scheduleDate){
            session.userData.taskDate = scheduleDate.entity;
            next();
        }
        else{
            session.beginDialog('/missingRecipient',{
                prompt: "Seems Like there is no date. Who is the date tasks?",
                retryPrompt: "Sorry that is incorrect."
            });
        }
    },

    function(session,results,next,args){

        if(!session.userData.taskDate){
            if (results.response) {
                session.userData.taskDate = results.response;
                session.send("taskDate is set to %s", results.response);
            }
            else {
                session.send("too many tries for taskDate");
            }
        }
         next();

    },


    function(session,args,next,req,res){

        var schedulePlace = builder.EntityRecognizer.findEntity(session.userData.entities,'place');

        if(schedulePlace){
            session.userData.taskPlace = schedulePlace.entity;
            next();
        }
        else{
            session.beginDialog('/missingTaskPlace',{
                prompt: "Seems Like there is no place. Where will it happend?",
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

    function(session,args){

        session.send("Task name: %s, TaskType %s, taskDate %s, task place %s", session.userData.taskName,  session.userData.taskType, session.userData.taskDate, session.userData.taskPlace)
/*can be a function for reusablitiy function(session){ session.something}*/
        session.userData.taskName = null;
        session.userData.taskType = null;
        session.userData.taskDate = null;
        session.userData.entities = null;
        session.userData.taskPlace = null;

    }



    /*To ADD DATE AND PLACE*/

    // function(session,args){
    //     var taskType = builder.EntityRecognizer.findEntity(args.entities,'tasktype');

    //     if(taskType){
    //         session.send("Hahahaha GOT TASK type");
    //     }
    //     else{
    //        session.beginDialog('/missingTaskType');

    //         //next();
    //        taskType = session.userData.taskType;
    //        session.send("Your new Task Name is %s as you mentioned, right?", session.userData.taskType);
    //     }

    // }

        // var scheduletype = builder.EntityRecognizer.findEntity(args.entities,'scheduletype');

        // if(scheduletype){
        //     session.send(scheduletype.entity);
        // }
        // else{
        //     session.send("no scheduletype");
        // }
]);


intents.matches('deletetasks', [

    function(session,args,next,req,res){
        /*Initialize the user session*/
        session.userData.newConversation = "initialized";

        /*Store the luis entites to the session to be used in the waterfall*/
        session.userData.entities = args.entities;

        /*Taks Name Definition*/
        var deleteTaskName = builder.EntityRecognizer.findEntity(session.userData.entities,'taskname');

        if(deleteTaskName){
            /*if there is a taskName store it to the session.userData*/
            session.userData.deleteTaskName = deleteTaskName.entity;
            next();
        }
        /*Create a new dialog if deleteTaskName Is Missing*/
        else{

            session.beginDialog('/missingDeleteTaskName',{
                prompt: "Seems Like I can't see the taskname, would you enter the name of the task to be deleted?",
                retryPrompt: "Sorry that's incorrect. It must not be empty"
            });
        }

    },

    function (session, results,next,res,req) {

        /*Just for the prompting*/
        if(!session.userData.deleteTaskName){
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

        var deleteScheduleDate = builder.EntityRecognizer.findEntity(session.userData.entities,'recipient');

        if(deleteScheduleDate){
            session.userData.deleteTaskDate = deleteScheduleDate.entity;
            next();
        }
        else{
            session.beginDialog('/missingDeleteTaskDate',{
                prompt: "Seems Like there is no date. When is the date of the task?",
                retryPrompt: "Sorry that is incorrect."
            });
        }
    },

    function(session,results,next,args){

        if(!session.userData.deleteTaskDate){
            if (results.response) {
                session.userData.deleteTaskDate = results.response;
                session.send("taskDate is set to %s", results.response);
            }
            else {
                session.send("too many tries for taskDate");
            }
        }
         next();

    },


    function(session,args){

        session.send("Task name to delete: %s, taskDate: %s", session.userData.deleteTaskName,  session.userData.deleteTaskDate);

        /*can be a function for reusablitiy function(session){ session.something}*/
        session.userData.deleteTaskName = null;
        // session.userData.taskType = null;
        session.userData.deleteTaskDate = null;
        session.userData.entities = null;
        // session.userData.taskPlace = null;

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

        var listScheduleDate = builder.EntityRecognizer.findEntity(session.userData.entities,'recipient');

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
            session.send(session.message.address.channelId);
        }
        else{
            session.beginDialog('/cannot');
        }
    }
]);

bot.dialog('/welcome', [
    function (session) {
        session.send('Hi! This is Eris, Your Personal Scheduling Bot');
        session.userData.newConversation = "initialized";
        session.endDialog();
    }
]);

bot.dialog('/cannot',[
    function(session){
        session.send('I Cannot Understand what you are saying!');
        session.endDialog();
    }
]);

bot.dialog('/missingTaskName', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingRecipient', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
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
    return response !== null;
}));

bot.dialog('/missingListTaskName', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingListTaskDate', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));


