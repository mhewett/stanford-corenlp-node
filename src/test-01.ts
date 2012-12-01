/*
 * This program tests the StanfordCoreNLP node wrapper.
 */
declare var require;
var events = require("minpubsub/minpubsub")

import nlplib = module("StanfordCoreNLP");

// Events 
var SERVER_AVAILABLE = "Server started";

// Create an instance of the server, passing in the config file.
var nlpServer = new nlplib.StanfordCoreNLP.Server("../config.json");
console.log("NLP server status: ", nlpServer.getStatus().getState());

// Start the server.  This is an asynchronous call.
// The callback will be run when the NLP library is ready (~20 seconds).
nlpServer.start(function() {
  events.publish(SERVER_AVAILABLE);
});

// This is an asynchronous loop.  
// It starts when the first SERVER_AVAILABLE event fires.
// Each time through it increments a counter and makes an
// asynchronous call that fires another SERVER_AVAILABLE event
// when it returns.

var counter : number = 0;
var testNLP = function() {
  counter++;
  var testString = null;
    
  switch (counter) {
    case 1 : testString = "Bill Clinton was president from 1992 to 2000.  He is not the president any more."; break;
    case 2 : testString = "Santa Claus is coming to town."; break;
    case 3 : nlpServer.stop();
  }

  // Process the string using the NLP library and print the result.
  // Then fire another event to trigger the function again.
  if (testString) {
    nlpServer.process(testString,
      function(result) {
        console.log(JSON.stringify(JSON.parse(result), null, "  "));
        events.publish(SERVER_AVAILABLE, testNLP);
      });
  }
}

// Start the test loop by subscribing to the event.
events.subscribe(SERVER_AVAILABLE, testNLP);
