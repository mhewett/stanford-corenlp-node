/*
 * This program tests the start and stop features of the StanfordCoreNLP node library.
 */
declare var require;
var events = require("minpubsub/minpubsub")

import nlplib = module("StanfordCoreNLP");
import nlpconfig = module("NLPConfig");

// Events 
var SERVER_AVAILABLE = "Server started";




var config = nlpconfig.NLPConfig.Configuration.readFromFile("../config.json");
console.log("Loaded the ", config.getName(), " config file.");

var nlpServer = new nlplib.StanfordCoreNLP.Server(config);

console.log("NLP server status: ", nlpServer.getStatus().getState());
nlpServer.start(function() {
    events.publish(SERVER_AVAILABLE);
});

var counter : number = 0;
var testNLP = function() {
    counter++;
    var testString = null;
    
    switch (counter) {
        case 1 : testString = "Bill Clinton was president from 1992 to 2000.  He is not the president any more."; break;
        case 2 : testString = "Santa Claus is coming to town."; break;
        case 3 : nlpServer.stop();
    }

    if (testString) {
        nlpServer.process(testString,
           function(result) {
               console.log(result);
               events.publish(SERVER_AVAILABLE, testNLP);
           });
    }
}
events.subscribe(SERVER_AVAILABLE, testNLP);



// Wait 28 seconds and send some text
/*
setTimeout(function() {
  
  setTimeout(function() {
      nlpServer.process(
    }, 5000);

  setTimeout(function() {
      nlpServer.stop();
    }, 10000);
   
}, 28000);
*/
