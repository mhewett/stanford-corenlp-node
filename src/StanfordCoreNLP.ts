/**
 * This is the main module for the Stanford CoreNLP node.js library.
 *
 * It allows a Node.js program to start, stop and interact with a Stanford CoreNLP server. 
 *
 * Mike Hewett   03 Nov 2012
 */

declare var require;

// This is used to call out to the OS and run processes.
var spawn = require("child_process").spawn;

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

        private host: string;
        private port: string;
        private state: string = ServerState.STOPPED;
        private startTime: Date = null;
        private config: any;  // The configuration for this server
        private nlpProcess: any = null;
        
    
        /**
         * Constructs a new instance of a Stanford CoreNLP server.
         */
        constructor(_host: string, _port: string, _config: any) {
            this.host = _host;
            this.port = _port;
            this.config = _config;
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
         * Start the NLP server, if it is not already started.
         */
        public start() {
            if (this.state === ServerState.STARTED) {
                console.log("The server was already started at " + this.startTime.toString());
                return this.state;
            }
            
            // Start the server here.
            this.runNLP();

            // if return code is good
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
            
            // Stop the server here.
            // ...
            // if return code is good
            this.state = ServerState.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.state;
            
            // else, show an error message
        }
        
        runNLP() {
            var myInstance = this;
            this.nlpProcess = spawn("ls", ["-ls", "/users"]);
            this.nlpProcess.stdout.on("data", function(data) {
                console.log("stdout: " + data);
            });
            this.nlpProcess.stderr.on("data", function(data) {
                console.log("stderr: " + data);
            });
            this.nlpProcess.on("exit", function(exitCode) {
                myInstance.stop();
            });
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
     * This class retrieves the config object for the NLP Server.
     */
    export class Config {
        
        private config: string;

        /**
         * Returns the config object to set pararmeters 
         * for stanford core nlp runtime setup
         */
        public getConfig() {
            this.config = require('../config.json');
            return this.config;
        }        
    }
}
