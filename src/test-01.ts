
import nlplib = module("StanfordCoreNLP");

var config = {};
var nlpServer = new nlplib.StanfordCoreNLP.Server("localhost", "5678", config);

console.log("NLP server status: " + nlpServer.getStatus().getState());
nlpServer.start();
//nlpServer.start();
//nlpServer.stop();
//nlpServer.stop();
