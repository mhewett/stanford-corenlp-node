var fs = require("fs");
var net = require("net");
var osProcess = require("child_process");
var path = require("path");
var xml2json = require("xml2json");

(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server(_config) {
            this.state = ServerState.STOPPED;
            this.startTime = null;
            this.nlpProcess = null;
            this.client = null;
            this.replyCallback = null;
            this.replyBuffer = "";
            this.configuration = _config;
        }
        Server.prototype.getStatus = function () {
            var status = new ServerStatus();
            status.setState(this.state);
            status.setStartTime(this.startTime);
            return status;
        };
        Server.prototype.process = function (text, callback) {
            this.replyBuffer = "";
            this.replyCallback = callback;
            console.log("Sending string to NLP: ", text);
            this.client.write(text + "\n");
        };
        Server.prototype.reply = function (text) {
            this.replyBuffer = "";
            var replyText = text;
            if(this.configuration.getOutputFormat() === "json") {
                try  {
                    replyText = xml2json.toJson(text);
                } catch (ex) {
                    console.log(ex);
                    console.log("========================================");
                    console.log(text);
                    console.log("========================================");
                }
            }
            this.replyCallback(replyText);
        };
        Server.prototype.start = function (callback) {
            if(this.state === ServerState.STARTED) {
                console.log("The server was already started at " + this.startTime.toString());
                return this.state;
            }
            if(!this.runNLP(callback)) {
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
            if(this.client) {
                this.client.end();
            }
            if(this.nlpProcess) {
                this.nlpProcess.kill();
            }
            this.state = ServerState.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.state;
        };
        Server.prototype.startClient = function (me, callback) {
            if(!me.client) {
                me.client = net.connect({
                    port: me.configuration.getPort()
                }, function () {
                    console.log("NLP client started.");
                    callback();
                });
                me.client.on('data', function (data) {
                    me.replyBuffer += data.toString();
                    if(me.replyBuffer.match("</root>")) {
                        me.reply(me.replyBuffer);
                    }
                });
                me.client.on('end', function () {
                    console.log('NLP client disconnected.');
                });
            }
        };
        Server.prototype.runNLP = function (callback) {
            if((!this.configuration) || (!this.configuration.getPath())) {
                console.log("Please supply a configuration with an executable path");
                return false;
            }
            var myInstance = this;
            var nlpProgram = this.configuration.getPath();
            var nlpDir = this.configuration.getNlpLibDir();
            var propsLocation = this.configuration.getPropsPath();
            console.log("Starting: ", nlpProgram);
            var args = [
                nlpDir
            ];
            if(propsLocation && fs.existsSync(propsLocation)) {
            }
            this.nlpProcess = osProcess.execFile(nlpProgram, args, {
            });
            this.nlpProcess.stdout.on("data", function (data) {
                if(data.match("listening on port")) {
                    myInstance.startClient(myInstance, callback);
                }
            });
            this.nlpProcess.stderr.on("data", function (data) {
                console.log("stderr: ", data);
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


