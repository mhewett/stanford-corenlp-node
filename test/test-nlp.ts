/* *
 * This program tests the stanford-corenlp-node package.
 * Usage:
 *    >
 *    > cd my_projects_dir
 *    > git clone git@github.com:mhewett/stanford-corenlp-node-example.git
 *    > cd stanford-corenlp-node-example
 *    > npm install
 *    >
 *    > cd example
 *    > cp StanfordCoreNLP.example.properties StanfordCoreNLP.properties
 *    > cp config.example.json config.json
 *    >
 *    > #[ edit config.json; ensure that "path", "nlpLibDir", and "propsPath" are set correctly   ]
 *    > #[ edit StanfordCoreNLP.properties; ensure that the path to the NER dictionary is correct ]
 *    >
 *    > # We are ready to run!
 *    > node example-as-package ./config.json
 *    >
 * 
 * Mike Hewett
 * Dec 2012
 * mike@hewettresearch.com 
 */

// These are required for TypeScript
declare var require, process;

// Third-party Node.js packages
var events = require("minpubsub/minpubsub");
var nlplib = require('../src/StanfordCoreNLP');

// Event declarations
var SERVER_AVAILABLE = "Server started";

// Create an instance of the server, passing in the config file.
var nlpServer = new nlplib.StanfordCoreNLP.Server(process.argv[2] || "./test-config.json");

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
    case 3 : console.log("NLP server status: ", nlpServer.getStatus().getState());
             events.publish(SERVER_AVAILABLE); 
             break;
    case 4 : nlpServer.stop(); break;
  }

  // Process the string using the NLP library and print the result.
  // Then fire another event to trigger the function again.
  if (testString) {
    nlpServer.process(testString,
      function(result) {
        console.log(JSON.stringify(JSON.parse(result), null, "  "));
        events.publish(SERVER_AVAILABLE);
      });
  }
}

// Ready the loop by subscribing to the event.
events.subscribe(SERVER_AVAILABLE, testNLP);
