/**
 * This is the main module for the Stanford CoreNLP node.js library.
 *
 * It allows a Node.js program to start, stop and interact with a Stanford CoreNLP server. 
 *
 * Mike Hewett   03 Nov 2012
 */
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
        private status: string = ServerStatus.STOPPED;
        private startTime: Date = null;
        private config: any;  // The configuration for this server
        
    
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
         * The result will be ServerStatus.STOPPED or ServerStatus.STARTED.
         * See the ServerStatus class in this module.
         */
        public getStatus() {
            return this.status;
        }
        
        /**
         * Start the NLP server, if it is not already started.
         */
        public start() {
            if (this.status === ServerStatus.STARTED) {
                console.log("The server was already started at " + this.startTime.toString());
                return this.status;
            }
            
            // Start the server here.
            // ...
            // if return code is good
            this.status = ServerStatus.STARTED;
            this.startTime = new Date();
            console.log("The NLP server has been started at " + this.startTime.toString());
            return this.status;
            
            // else, show an error message
        }
        
        /**
         * Stop the NLP server, if it is not already stopped.
         */
        public stop() {
            if (this.status === ServerStatus.STOPPED) {
                console.log("The server is already stopped.");
                return this.status;
            }
            
            // Stop the server here.
            // ...
            // if return code is good
            this.status = ServerStatus.STOPPED;
            this.startTime = null;
            console.log("The NLP server has been stopped.");
            return this.status;
            
            // else, show an error message
        }

    }
    
    export class ServerStatus {
        public static STOPPED: string = "Stopped";
        public static STARTED: string = "Started";
    }
    

}
