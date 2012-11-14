/**
 * This is the main module for the Stanford CoreNLP node.js library.
 *
 * It allows a Node.js program to start, stop and interact with a Stanford CoreNLP server. 
 *
 * Mike Hewett   03 Nov 2012
 */

declare var require;

// This is used to call out to the OS and run processes.
var osProcess = require("child_process");
var path = require("path");
var net = require("net");


import nlpconfig = module("NLPConfig");

export module StanfordCoreNLP {
  
    /**
     * The Server class represents an instance of the Stanford CoreNLP server.
     * The Server can be running on the local or remote machine.
     * The primary method is the process(String) method, which sends text to the
     * CoreNLP server for processing and returns results.
     * Methods are also provided to start, stop and get the status of the Stanford CoreNLP server.
     *
     * Usage:
     *   1. var myServer = new StanfordCoreNLP.Server(host, port);
     *   2. myServer.start();  // if it is not already running
     *   3. var results = myServer.process("text...");
     *   4. ...
     *   5. myServer.stop();
     *
     * After stopping the server, it can be restarted.
     */
    export class Server {

        private state: string = ServerState.STOPPED;
        private startTime: Date = null;
        private configuration: nlpconfig.NLPConfig.Configuration;  // The configuration for this server
        private nlpProcess: any = null;
        private client: any = null;
        private replyCallback : any = null;
        private replyBuffer : string = "";
        
    
        /**
         * Constructs a new instance of a Stanford CoreNLP server.
         */
        constructor(_config: nlpconfig.NLPConfig.Configuration) {
            this.configuration = _config;
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
            this.replyBuffer = "";
            this.replyCallback = callback;
            console.log("Sending string to NLP: ", text);
            this.client.write(text + "\n");
        }
        
        /**
         * Reply to the process() call.
         * This is not right yet.
         * It's not safe for multiple concurrent calls.
         */
        public reply(text: string) {
            this.replyCallback(text);
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
         * Contact the NLP server on a socket.
         * The callback does not take any arguments and should be called when the client is ready.
         */
        startClient(me: Server, callback : any) {
            if (! me.client) {
                me.client = net.connect({port: me.configuration.getPort()},
                    function() {
                        console.log("NLP client started.");
                        callback();
                        });
                me.client.on('data', function(data) {
                    console.log(data.toString());
                });
                me.client.on('end', function() {
                    console.log('NLP client disconnected.');
                });
            }
        }
                
        runNLP(callback) {
            if ((! this.configuration) || (! this.configuration.getPath())) {
                console.log("Please supply a configuration with an executable path");
                return false;
            }
            
            var myInstance = this;
            var nlpProgram = this.configuration.getPath();
            var nlpDir = this.configuration.getNlpLibDir();
            var propsLocation = this.configuration.getPropsPath();
            console.log("Starting: ", nlpProgram);
            
            // Set up the arguments.
            var args = [nlpDir];
            if (propsLocation) {
                args.push('-props');
                args.push(propsLocation);
            }

            // Start the program            
            this.nlpProcess = osProcess.execFile(nlpProgram, args, {});      // {"cwd": nlpDir});
            
            this.nlpProcess.stdout.on("data", function(data) {
                console.log(data);
                myInstance.replyBuffer += data;
                if (data.match("listening on port")) {
                    myInstance.startClient(myInstance, callback);
                }
                if (data.match("processed") && data.match("bytes")) {
                    myInstance.reply(myInstance.replyBuffer);
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
}
