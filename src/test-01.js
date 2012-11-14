var nlplib = require("./StanfordCoreNLP")
var nlpconfig = require("./NLPConfig")
var config = nlpconfig.NLPConfig.Configuration.readFromFile("../config.json");
console.log("Loaded the ", config.getName(), " config file.");
var nlpServer = new nlplib.StanfordCoreNLP.Server(config);
console.log("NLP server status: ", nlpServer.getStatus().getState());
nlpServer.start();
setTimeout(function () {
    nlpServer.process("Bill Clinton was president from 1992 to 2000.  He is not the president any more.");
    setTimeout(function () {
        nlpServer.process("Santa Claus is coming to town.");
    }, 5000);
    setTimeout(function () {
        nlpServer.stop();
    }, 10000);
}, 28000);

