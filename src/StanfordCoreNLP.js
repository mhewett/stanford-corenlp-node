var fs = require("fs");
var net = require("net");
var osProcess = require("child_process");
var path = require("path");
var xml2json = require("xml2json");

(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server(configfilepath) {
            this.state = ServerState.STOPPED;
            this.startTime = null;
            this.nlpProcess = null;
            this.client = null;
            this.replyCallback = null;
            this.replyBuffer = "";
            this.configuration = ServerConfiguration.readFromFile(configfilepath);
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
                args.push('-props');
                args.push(path.resolve(__dirname, propsLocation));
                console.log("Properties files is: ", path.resolve(__dirname, propsLocation));
            }
            this.nlpProcess = osProcess.execFile(nlpProgram, args, {
            });
            this.nlpProcess.stdout.on("data", function (data) {
                console.log(data);
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
    var ServerConfiguration = (function () {
        function ServerConfiguration() {
            this.outputFormat = "json";
        }
        ServerConfiguration.prototype.getId = function () {
            return this.id;
        };
        ServerConfiguration.prototype.setId = function (newValue) {
            this.id = newValue;
            return this;
        };
        ServerConfiguration.prototype.getName = function () {
            return this.name;
        };
        ServerConfiguration.prototype.setName = function (newValue) {
            this.name = newValue;
            return this;
        };
        ServerConfiguration.prototype.getDescription = function () {
            return this.description;
        };
        ServerConfiguration.prototype.setDescription = function (newValue) {
            this.description = newValue;
            return this;
        };
        ServerConfiguration.prototype.getNlpLibDir = function () {
            return this.nlpLibDir;
        };
        ServerConfiguration.prototype.setNlpLibDir = function (newValue) {
            this.nlpLibDir = newValue;
            return this;
        };
        ServerConfiguration.prototype.getOutputFormat = function () {
            return this.outputFormat;
        };
        ServerConfiguration.prototype.setOutputFormat = function (newValue) {
            this.outputFormat = newValue;
            return this;
        };
        ServerConfiguration.prototype.getPath = function () {
            return this.path;
        };
        ServerConfiguration.prototype.setPath = function (newValue) {
            this.path = newValue;
            return this;
        };
        ServerConfiguration.prototype.getHost = function () {
            return this.host;
        };
        ServerConfiguration.prototype.setHost = function (newValue) {
            this.host = newValue;
            return this;
        };
        ServerConfiguration.prototype.getPort = function () {
            return this.port;
        };
        ServerConfiguration.prototype.setPort = function (newValue) {
            this.port = newValue;
            return this;
        };
        ServerConfiguration.prototype.getPropsPath = function () {
            return this.propsPath;
        };
        ServerConfiguration.prototype.setPropsPath = function (newValue) {
            this.propsPath = newValue;
            return this;
        };
        ServerConfiguration.readFromFile = function readFromFile(path) {
            var obj = JSON.parse(fs.readFileSync(path, 'utf8'));
            var returnObj = new ServerConfiguration();
            for(var prop in obj) {
                if(obj.hasOwnProperty(prop)) {
                    returnObj[prop] = obj[prop];
                }
            }
            return returnObj;
        }
        ServerConfiguration.prototype.writeToFile = function (path) {
            fs.writeFileSync(path, JSON.stringify(this, null, "  "), 'utf8');
        };
        return ServerConfiguration;
    })();
    StanfordCoreNLP.ServerConfiguration = ServerConfiguration;    
})(exports.StanfordCoreNLP || (exports.StanfordCoreNLP = {}));
var StanfordCoreNLP = exports.StanfordCoreNLP;
//@ sourceMappingURL=StanfordCoreNLP.js.map
