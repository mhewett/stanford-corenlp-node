var spawn = require("child_process").spawn;
(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server(_host, _port, _config) {
            this.state = ServerState.STOPPED;
            this.startTime = null;
            this.nlpProcess = null;
            this.host = _host;
            this.port = _port;
            this.config = _config;
        }
        Server.prototype.getStatus = function () {
            var status = new ServerStatus();
            status.setState(this.state);
            status.setStartTime(this.startTime);
            return status;
        };
        Server.prototype.start = function () {
            if(this.state === ServerState.STARTED) {
                console.log("The server was already started at " + this.startTime.toString());
                return this.state;
            }
            this.runNLP();
            this.state = ServerState.STARTED;
            this.startTime = new Date();
            console.log("The NLP server has been started at " + this.startTime.toString());
            return this.state;
        };
        Server.prototype.stop = function () {
            if(this.state === ServerState.STOPPED) {
                console.log("The server is already stopped.");
                return this.state;
            }
            this.state = ServerState.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.state;
        };
        Server.prototype.runNLP = function () {
            var myInstance = this;
            this.nlpProcess = spawn("ls", [
                "-ls", 
                "/users"
            ]);
            this.nlpProcess.stdout.on("data", function (data) {
                console.log("stdout: " + data);
            });
            this.nlpProcess.stderr.on("data", function (data) {
                console.log("stderr: " + data);
            });
            this.nlpProcess.on("exit", function (exitCode) {
                myInstance.stop();
            });
        };
        return Server;
    })();
    StanfordCoreNLP.Server = Server;    
    var ServerState = (function () {
        function ServerState() { }
        ServerState.STOPPED = "Stopped";
        ServerState.STARTED = "Started";
        return ServerState;
    })();
    StanfordCoreNLP.ServerState = ServerState;    
    var ServerStatus = (function () {
        function ServerStatus() { }
        ServerStatus.prototype.setState = function (state) {
            this.state = state;
        };
        ServerStatus.prototype.setStartTime = function (time) {
            this.startTime = time;
        };
        ServerStatus.prototype.getState = function () {
            return this.state;
        };
        ServerStatus.prototype.getStartTime = function () {
            return this.startTime;
        };
        return ServerStatus;
    })();
    StanfordCoreNLP.ServerStatus = ServerStatus;    
    var Config = (function () {
        function Config() { }
        Config.prototype.getConfig = function () {
            this.config = require('../config.json');
            return this.config;
        };
        return Config;
    })();
    StanfordCoreNLP.Config = Config;    
})(exports.StanfordCoreNLP || (exports.StanfordCoreNLP = {}));


