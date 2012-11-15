/**
 * This is the config module for the NLP node.js libraries.
 *
 * It allows a Node.js program to read and setup properties for NLP servers. 
 *
 * Shamod Lacoul   10 Nov 2012
 */

// Node libraries
declare var require;
var fs = require("fs");
var osProcess = require("child_process");
var path = require("path");

export module NLPConfig {
    /**
     * This class encapsulates the description of how to run an NLP Server.
     */
    export class Configuration {
        
        private id: string;         // "stanfordnlp"
        private name: string;       //"Stanford CoreNLP",
        private description: string; 
        private path: string;       // The path to the executable program.
        private nlpLibDir: string;     // Folder containing NLP library
        private host: string;       // "localhost"
        private port: string;       // "1234",
        private propsPath: string;  // Path to the properties file.
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
        public static readFromFile(path: string) : Configuration {
            var obj: Object = JSON.parse(fs.readFileSync(path, 'utf8'));
        
            // Create a new testObj and copy the fields over
            var returnObj = new Configuration();
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