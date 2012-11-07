
import nlplib = module("StanfordCoreNLP");

var config = new nlplib.StanfordCoreNLP.Config();

console.log("config", config.getConfig());

var nlpServer = new nlplib.StanfordCoreNLP.Server("localhost", "5678", config.getConfig);

console.log("NLP server status: " + nlpServer.getStatus().getState());
nlpServer.start();
//nlpServer.start();
//nlpServer.stop();
//nlpServer.stop();
