var nlplib = require("./StanfordCoreNLP")
var nlpconfig = require("./NLPConfig")
var config = nlpconfig.NLPConfig.Configuration.readFromFile("../config.json");
console.log("Loaded the ", config.getName(), " config file.");
var nlpServer = new nlplib.StanfordCoreNLP.Server(config);
console.log("NLP server status: ", nlpServer.getStatus().getState());
nlpServer.start();
setTimeout(function () {
    nlpServer.stop();
}, 5000);

