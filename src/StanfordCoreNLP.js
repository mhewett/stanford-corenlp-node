(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server() { }
        Server.prototype.hello = function (name) {
            console.log("hello " + name);
        };
        return Server;
    })();
    StanfordCoreNLP.Server = Server;    
})(exports.StanfordCoreNLP || (exports.StanfordCoreNLP = {}));


