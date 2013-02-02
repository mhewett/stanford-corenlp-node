var fs = require("fs");
var net = require("net");
var osProcess = require("child_process");
var path = require("path");
var request = require("request");
var xml2json = require("xml2json");
(function (StanfordCoreNLP) {
    var Server = (function () {
        function Server(configfilepath) {
            this.state = ServerState.STOPPED;
            this.startTime = null;
            this.nlpProcess = null;
            this.client = null;
            if(configfilepath) {
                this.configuration = ServerConfiguration.readFromFile(configfilepath);
            } else {
                console.log("Please provide the correct configuration file path");
            }
        }
        Server.CORENLP_WEB_SERVICE_BASE = "/corenlp/api/v1/";
        Server.prototype.getConfiguration = function () {
            return this.configuration;
        };
        Server.prototype.getStatus = function () {
            var status = new ServerStatus();
            status.setState(this.state);
            status.setStartTime(this.startTime);
            return status;
        };
        Server.prototype.process = function (text, callback) {
            if(this.configuration.getDebug()) {
                console.log("Sending string to NLP: ", text);
            }
            var url = "http://" + this.configuration.getHost() + ":" + this.configuration.getPort() + Server.CORENLP_WEB_SERVICE_BASE + "analysis";
            var that = this;
            this.callWebService(url, {
                "text": text
            }, function (wsResponse) {
                if(that.configuration.getDebug()) {
                    console.log("Stanford CoreNLP: ", wsResponse);
                }
                if(wsResponse && wsResponse.status) {
                    callback(wsResponse);
                }
                var replyText = wsResponse;
                if(that.configuration.getOutputFormat() === "json") {
                    try  {
                        replyText = xml2json.toJson(replyText);
                    } catch (ex) {
                        console.log(ex);
                        console.log("========================================");
                        console.log(replyText);
                        console.log("========================================");
                    }
                }
                callback(replyText);
            });
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
            var url = "http://" + this.configuration.getHost() + ":" + this.configuration.getPort() + Server.CORENLP_WEB_SERVICE_BASE + "hello";
            this.callWebService(url, null, callback);
        };
        Server.prototype.callWebService = function (url, formdata, callback) {
            if(formdata) {
                request.post(url, {
                    "form": formdata
                }, function (error, response, body) {
                    if(error || response.statusCode != 201) {
                        console.log(response.statusCode, ": ", error);
                        callback({
                            "status": "error"
                        });
                    } else {
                        callback(body);
                    }
                });
            } else {
                request.get(url, function (error, response, body) {
                    if(error || response.statusCode != 200) {
                        console.log(response.statusCode, ": ", error);
                        callback({
                            "status": "error"
                        });
                    } else {
                        callback(body);
                    }
                });
            }
        };
        Server.prototype.runNLP = function (callback) {
            if((!this.configuration) || (!this.configuration.getPath())) {
                console.log("Please supply a configuration with an executable path");
                return false;
            }
            if(this.configuration.getHost() !== "localhost") {
                console.log("Contacting remote client at ", this.configuration.getHost(), ":", this.configuration.getPort());
                this.startClient(this, callback);
                return true;
            }
            var myInstance = this;
            var nlpProgram = this.configuration.getPath();
            var nlpDir = this.configuration.getNlpLibDir();
            var classpath = this.configuration.getClasspath();
            var propsLocation = this.configuration.getPropsPath();
            var nlpLibraries = this.configuration.getNlpLibraries();
            console.log("Starting: ", nlpProgram);
            var args = [
                nlpDir, 
                nlpLibraries, 
                classpath
            ];
            if(propsLocation && fs.existsSync(propsLocation)) {
                args.push('-props');
                args.push(propsLocation);
                console.log("Properties files is: ", propsLocation);
            }
            this.nlpProcess = osProcess.execFile(nlpProgram, args, {
            });
            this.nlpProcess.stdout.on("data", function (data) {
                console.log(data);
                if(data.match("running on port")) {
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
            this.id = "stanford-corenlp";
            this.name = null;
            this.debug = false;
            this.description = null;
            this.path = null;
            this.classpath = ".";
            this.nlpLibDir = null;
            this.nlpLibraries = null;
            this.host = null;
            this.port = null;
            this.propsPath = null;
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
        ServerConfiguration.prototype.getClasspath = function () {
            return this.classpath;
        };
        ServerConfiguration.prototype.setClasspath = function (newValue) {
            this.classpath = newValue;
            return this;
        };
        ServerConfiguration.prototype.getDebug = function () {
            return this.debug;
        };
        ServerConfiguration.prototype.setDebug = function (newValue) {
            this.debug = newValue;
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
        ServerConfiguration.prototype.getNlpLibraries = function () {
            return this.nlpLibraries;
        };
        ServerConfiguration.prototype.setNlpLibraries = function (newValue) {
            this.nlpLibraries = newValue;
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
            console.log("Loading config file: ", path);
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
