/*
Skuld : Simple Taskbot
Created by: Jaime R. Canicula

Thanks to Pia Carmela Quizon for helping me on the LUIS 
and the concept of Node.js
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
            
            session.beginDialog('/missingTasks',{
                prompt: "Seems Like there is no task name. What is the name of your tasks?", 
                retryPrompt: "Sorry that's incorrect. It must not be empty" 
            });    
        }

    },
    function (session, results,next,res,req) {
       

        session.send(session.userData.entities + ' like');

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

        var recipient = builder.EntityRecognizer.findEntity(session.userData.entities,'scheduletype');

        if(recipient){
            // session.send("Got Task Type");
            session.userData.taskType = recipient.entity;
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


/*(bot.dialog('/missingTasks',[
    function(session){
        // builder.Prompts.text(session,'I know you are trying to create a task and I cannot identify your task name or I think it`s not provided. Can you tell me What is the name of your Task?');
        builder.Prompts.text(session,'Missing taskName. Input task name.');
    },
    function(session,results,next){
        //if(results.response){

        //clear previous task name
        session.userData.taskName = '';

        //assign new
        session.userData.taskName = results.response;
        session.userData.taskName = 'static';
        session.endDialog();
        //}
    }    
]);

*/


bot.dialog('/meaningOfLife', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response;
}));


bot.dialog('/missingTasks', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingRecipient', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));

bot.dialog('/missingTaskType', builder.DialogAction.validatedPrompt(builder.PromptType.text, function (response) {
    return response !== null;
}));