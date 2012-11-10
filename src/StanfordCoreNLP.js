var osProcess = require("child_process");
var path = require("path");

(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server(_config) {
            this.state = ServerState.STOPPED;
            this.startTime = null;
            this.nlpProcess = null;
            this.configuration = _config;
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
            if(!this.runNLP()) {
                console.log("Unable to start the NLP server.");
                return;
            }
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
            if(this.nlpProcess) {
                this.nlpProcess.kill();
            }
            this.state = ServerState.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.state;
        };
        Server.prototype.runNLP = function () {
            if((!this.configuration) || (!this.configuration.getPath())) {
                console.log("Please supply a configuration with an executable path");
                return false;
            }
            var myInstance = this;
            var nlpProgram = this.configuration.getPath();
            var nlpDir = path.dirname(nlpProgram);
            console.log("Starting: ", nlpProgram);
            this.nlpProcess = osProcess.execFile(nlpProgram, [], {
                "cwd": nlpDir
            });
            this.nlpProcess.stdout.on("data", function (data) {
                console.log("stdout: " + data);
            });
            this.nlpProcess.stderr.on("data", function (data) {
                console.log("stderr: " + data);
            });
            this.nlpProcess.on("exit", function (exitCode) {
                if(myInstance.state !== ServerState.STOPPED) {
                    myInstance.stop();
                }
            });
            return true;
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
})(exports.StanfordCoreNLP || (exports.StanfordCoreNLP = {}));


