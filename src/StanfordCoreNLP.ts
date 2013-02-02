/**
 * This is the main module for the Stanford CoreNLP node.js library.
 *
 * It allows a Node.js program to start, stop and interact with a Stanford CoreNLP server. 
 *
 * Mike Hewett   03 Nov 2012
 */

declare var require;
declare var __dirname;

// This is used to call out to the OS and run processes.
var fs = require("fs");
var net = require("net");
var osProcess = require("child_process");
var path = require("path");
var request = require("request");
var xml2json = require("xml2json");
//var process = require("process");


export module StanfordCoreNLP {
  
    /**
     * The Server class represents an instance of the Stanford CoreNLP server.
     * The Server can be running on the local or remote machine.
     * The primary method is the process(String) method, which sends text to the
     * CoreNLP server for processing and returns results.
     * Methods are also provided to start, stop and get the status of the Stanford CoreNLP server.
     *
     * Usage:
     *   1. var myServer = new StanfordCoreNLP.Server("nlp-config.json");
     *   2. myServer.start(callback);  // Callback is called when it has started.
     *   3. var results = myServer.process("text...", callback);  // callback is called with the JSON results
     *   4. ...
     *   5. myServer.stop();
     *
     * After stopping the server, it can be restarted.
     */
    export class Server {

        private static CORENLP_WEB_SERVICE_BASE : string = "/corenlp/api/v1/"; 
        
        private state: string = ServerState.STOPPED;
        private startTime: Date = null;
        private configuration: ServerConfiguration;  // The configuration for this server
        private nlpProcess: any = null;
        private client: any = null;

        /**
         * Constructs a new instance of a Stanford CoreNLP server.
         */
        constructor(configfilepath: string) {
            if(configfilepath) {
                this.configuration = ServerConfiguration.readFromFile(configfilepath);  // path.resolve(__dirname, configfilepath));    
            }
            else {
                console.log("Please provide the correct configuration file path");
            }            
        }
        
        /**
         * Return the configuration
         */
        public getConfiguration() {
          return this.configuration;
        }
    
        /**
         * Returns the status of the server.  
         * See the ServerStatus class in this module.
         */
        public getStatus() {
            var status: ServerStatus = new ServerStatus();
            status.setState(this.state);
            status.setStartTime(this.startTime);
            return status;
        }

        /**
         * Process text.
         * The callback takes one argument, the result.
         * 
         */
        public process(text: string, callback) {
          if (this.configuration.getDebug()) {
            console.log("Sending string to NLP: ", text);
          }
          
          var url = "http://" + this.configuration.getHost()
                    + ":" + this.configuration.getPort()
                    + Server.CORENLP_WEB_SERVICE_BASE + "analysis";
          
          var that = this;
          this.callWebService(url,
            {"text": text}, 
            function(wsResponse) {
              if (that.configuration.getDebug()) {
                console.log("Stanford CoreNLP: ", wsResponse);
              }
              
              if (wsResponse && wsResponse.status) {
                // It is already JSON
                callback(wsResponse);
              }
              
              // Otherwise, convert from XML to JSON
              var replyText = wsResponse;
              if (that.configuration.getOutputFormat() === "json") {
                try {
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
        }


        /**
         * Start the NLP server, if it is not already started.
         * callback has no arguments.  It is called when the server is ready.
         */
        public start(callback) {
            if (this.state === ServerState.STARTED) {
                console.log("The server was already started at " + this.startTime.toString());
                return this.state;
            }
            
            // Start the server here.
            if (! this.runNLP(callback)) {
                console.log("Unable to start the NLP server.");
                return;
            }

            // if successful in starting...
            this.state = ServerState.STARTED;
            this.startTime = new Date();
            console.log("The NLP server has been started at " + this.startTime.toString());
            return this.state;
            
            // else, show an error message
        }

        /**
         * Stop the NLP server, if it is not already stopped.
         */
        public stop() {
            if (this.state === ServerState.STOPPED) {
                console.log("The server is already stopped.");
                return this.state;
            }
            
            // Close the socket
            if (this.client) {
                this.client.end();
            }
            
            // Stop the server
            if (this.nlpProcess) {
                this.nlpProcess.kill();
            }

            // if return code is good
            this.state = ServerState.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.state;
            
            // else, show an error message
        }

        /**
         * Checks the "hello" web service and tells the client if it is ready.
         * This procedure takes the server as an argument and should be called when the client is ready.
         * The callback takes no arguments.
         */
        startClient(me: Server, callback : any) {
          var url = "http://" + this.configuration.getHost()
                    + ":" + this.configuration.getPort()
                    + Server.CORENLP_WEB_SERVICE_BASE + "hello";
          
          this.callWebService(url, null, callback);
        }
  
        /**
         * Calls the web service.  
         * @param options: options to http.request()
         * @param data: JSON data if POST, null if GET
         * @para callback: function to be called with the output
         */      
        callWebService(url : string, formdata: any, callback: any) {
          if (formdata) {
            request.post(url, { "form" : formdata}, 
              function(error, response, body) {
                if (error || response.statusCode != 201) {
                  console.log(response.statusCode, ": ", error);
                  callback({ "status": "error" });
                } else {
                  callback(body);  
                }
              });
          }
          else {
            request.get(url,
              function(error, response, body) {
                if (error || response.statusCode != 200) {
                  console.log(response.statusCode, ": ", error);
                  callback({ "status": "error" });
                } else {
                  callback(body);  
                }
              });
          }
        }
        
        /**
         * Call this to start the Stanford CoreNLP library.  
         * It will return callback() with no parameters when it is ready.
         * It check readiness by waiting about 10 seconds, then calling
         * the "hello" web service.
         */
        runNLP(callback) {
            if ((! this.configuration) || (! this.configuration.getPath())) {
                console.log("Please supply a configuration with an executable path");
                return false;
            }
            
            // Don't start it if it is not running on localhost
            if (this.configuration.getHost() !== "localhost") {
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
            
            // Set up the arguments.
            var args = [nlpDir, nlpLibraries, classpath];
            if (propsLocation && fs.existsSync(propsLocation)) {
                args.push('-props');
                args.push(propsLocation);  // path.resolve(__dirname, propsLocation));
                console.log("Properties files is: ", propsLocation);  // path.resolve(__dirname, propsLocation));
            }

            // Start the program            
            this.nlpProcess = osProcess.execFile(nlpProgram, args, {});      // {"cwd": nlpDir});
            
            // Wait for the process to start
            this.nlpProcess.stdout.on("data", function(data) {
                console.log(data);
                if (data.match("running on port")) {
                    myInstance.startClient(myInstance, callback);
                }
            });
            this.nlpProcess.stderr.on("data", function(data) {
                console.log("stderr: ", data);
            });
            this.nlpProcess.on("exit", function(exitCode) {
                if (myInstance.state !== ServerState.STOPPED) {
                    myInstance.stop();
                }
            });

            return true;
        }

    }
    
    /**
     * This is an enumeration of possible server states.
     * This is a placeholder until TypeScript has real enums.
     */
    export class ServerState {
        public static STOPPED: string = "Stopped";
        public static STARTED: string = "Started";
    }
    
    /**
     * This class encapsulates the current state of the NLP Server.
     */
    export class ServerStatus {
        private state: string;
        private startTime: Date;
        
        public setState(state: string) {
            this.state = state;
        }
        
        public setStartTime(time: Date) {
            this.startTime = time;
        }
        
        public getState() {
            return this.state;
        }
        
        public getStartTime() {
            return this.startTime;
        }
    }

    /**
     * This class encapsulates the description of how to run an NLP Server.
     */
    export class ServerConfiguration {
        
        private id: string = "stanford-corenlp";  // "stanfordnlp"
        private name: string = null;            //"Stanford CoreNLP",
        private debug: bool = false;
        private description: string = null; 
        private path: string = null;            // The path to the executable program.
        private classpath: string = ".";        // Optional classpath
        private nlpLibDir: string = null;       // Folder containing NLP library jars
        private nlpLibraries: string = null;    // NLP libraries to use
        private host: string = null;            // "localhost"
        private port: string = null;            // "1234",
        private propsPath: string = null;       // Path to the properties file.
        private outputFormat: string = "json";  // "xml" or "json"

        /** Getter */
        public getId() { 
            return this.id;
        }

        /** Setter */
        public setId(newValue: string) {
            this.id = newValue; 
            return this;
        }

        /** Getter */
        public getName() { 
            return this.name;
        }

        /** Setter */
        public setName(newValue: string) {
            this.name = newValue; 
            return this;
        }

        /** Getter */
        public getClasspath() { 
            return this.classpath;
        }

        /** Setter */
        public setClasspath(newValue: string) {
            this.classpath = newValue; 
            return this;
        }

        /** Getter */
        public getDebug() { 
            return this.debug;
        }

        /** Setter */
        public setDebug(newValue: bool) {
            this.debug = newValue; 
            return this;
        }

        /** Getter */
        public getDescription() { 
            return this.description;
        }

        /** Setter */
        public setDescription(newValue: string) {
            this.description = newValue; 
            return this;
        }

        /** Getter */
        public getNlpLibDir() { 
            return this.nlpLibDir;
        }

        /** Setter */
        public setNlpLibDir(newValue: string) {
            this.nlpLibDir = newValue; 
            return this;
        }

        /** Getter */
        public getNlpLibraries() { 
            return this.nlpLibraries;
        }

        /** Setter */
        public setNlpLibraries(newValue: string) {
            this.nlpLibraries = newValue; 
            return this;
        }

        /** Getter */
        public getOutputFormat() { 
            return this.outputFormat;
        }

        /** Setter */
        public setOutputFormat(newValue: string) {
            this.outputFormat = newValue; 
            return this;
        }

        /** Getter */
        public getPath() { 
            return this.path;
        }

        /** Setter */
        public setPath(newValue: string) {
            this.path = newValue; 
            return this;
        }

        /** Getter */
        public getHost() { 
            return this.host;
        }

        /** Setter */
        public setHost(newValue: string) {
            this.host = newValue; 
            return this;
        }

        /** Getter */
        public getPort() { 
            return this.port;
        }

        /** Setter */
        public setPort(newValue: string) {
            this.port = newValue; 
            return this;
        }

        /** Getter */
        public getPropsPath() { 
            return this.propsPath;
        }

        /** Setter */
        public setPropsPath(newValue: string) {
            this.propsPath = newValue; 
            return this;
        }
        
        /**
         * Reads an instance of this class from a file.
         */
        public static readFromFile(path: string) : ServerConfiguration {
          console.log("Loading config file: ", path)
          var obj: Object = JSON.parse(fs.readFileSync(path, 'utf8'));
          // console.log(JSON.stringify(obj, null, "  "));  
        
          // Create a new testObj and copy the fields over
          var returnObj = new ServerConfiguration();
          for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
              returnObj[prop] = obj[prop];
            }
          }
        
          return returnObj;
        }

        /**
         * Writes this object in JSON format to the given file.
         */        
        public writeToFile(path: string) {
            fs.writeFileSync(path, JSON.stringify(this, null, "  "), 'utf8');
        }    
    }
}
