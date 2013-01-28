var events = require("minpubsub/minpubsub");
var nlplib = require('../src/StanfordCoreNLP');
var SERVER_AVAILABLE = "Server started";
var nlpServer = new nlplib.StanfordCoreNLP.Server(process.argv[2] || "./test-config.json");
nlpServer.start(function () {
    events.publish(SERVER_AVAILABLE);
});
var counter = 0;
var testNLP = function () {
    counter++;
    var testString = null;
    switch(counter) {
        case 1: {
            testString = "Bill Clinton was president from 1992 to 2000.  He is not the president any more.";
            break;

        }
        case 2: {
            testString = "Santa Claus is coming to town.";
            break;

        }
        case 3: {
            console.log("NLP server status: ", nlpServer.getStatus().getState());
            events.publish(SERVER_AVAILABLE);
            break;

        }
        case 4: {
            nlpServer.stop();
            break;

        }
    }
    if(testString) {
        nlpServer.process(testString, function (result) {
            console.log(JSON.stringify(JSON.parse(result), null, "  "));
            events.publish(SERVER_AVAILABLE);
        });
    }
};
events.subscribe(SERVER_AVAILABLE, testNLP);
//@ sourceMappingURL=test-nlp.js.map
