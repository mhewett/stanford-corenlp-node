(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server(_host, _port, _config) {
            this.status = ServerStatus.STOPPED;
            this.startTime = null;
            this.host = _host;
            this.port = _port;
            this.config = _config;
        }
        Server.prototype.getStatus = function () {
            return this.status;
        };
        Server.prototype.start = function () {
            if(this.status === ServerStatus.STARTED) {
                console.log("The server was already started at " + this.startTime.toString());
                return this.status;
            }
            this.status = ServerStatus.STARTED;
            this.startTime = new Date();
            console.log("The NLP server has been started at " + this.startTime.toString());
            return this.status;
        };
        Server.prototype.stop = function () {
            if(this.status === ServerStatus.STOPPED) {
                console.log("The server is already stopped.");
                return this.status;
            }
            this.status = ServerStatus.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.status;
        };
        return Server;
    })();
    StanfordCoreNLP.Server = Server;    
    var ServerStatus = (function () {
        function ServerStatus() { }
        ServerStatus.STOPPED = "Stopped";
        ServerStatus.STARTED = "Started";
        return ServerStatus;
    })();
    StanfordCoreNLP.ServerStatus = ServerStatus;    
})(exports.StanfordCoreNLP || (exports.StanfordCoreNLP = {}));


