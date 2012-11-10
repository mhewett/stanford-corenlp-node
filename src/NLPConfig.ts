/**
 * This is the config module for the NLP node.js libraries.
 *
 * It allows a Node.js program to read and setup properties for NLP servers. 
 *
 * Shamod Lacoul   10 Nov 2012
 */

declare var require;

// This is used to call out to the OS and run processes.
var osProcess = require("child_process");
var path = require("path");

export module NLPConfig {
    /**
     * This class retrieves the config object for the NLP Server.
     */
    export class Config {
        
        private config: any;

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