var fs = require("fs");
var osProcess = require("child_process");
var path = require("path");
(function (NLPConfig) {
    var Configuration = (function () {
        function Configuration() { }
        Configuration.prototype.getId = function () {
            return this.id;
        };
        Configuration.prototype.setId = function (newValue) {
            this.id = newValue;
            return this;
        };
        Configuration.prototype.getName = function () {
            return this.name;
        };
        Configuration.prototype.setName = function (newValue) {
            this.name = newValue;
            return this;
        };
        Configuration.prototype.getDescription = function () {
            return this.description;
        };
        Configuration.prototype.setDescription = function (newValue) {
            this.description = newValue;
            return this;
        };
        Configuration.prototype.getNlpLibDir = function () {
            return this.nlpLibDir;
        };
        Configuration.prototype.setNlpLibDir = function (newValue) {
            this.nlpLibDir = newValue;
            return this;
        };
        Configuration.prototype.getPath = function () {
            return this.path;
        };
        Configuration.prototype.setPath = function (newValue) {
            this.path = newValue;
            return this;
        };
        Configuration.prototype.getHost = function () {
            return this.host;
        };
        Configuration.prototype.setHost = function (newValue) {
            this.host = newValue;
            return this;
        };
        Configuration.prototype.getPort = function () {
            return this.port;
        };
        Configuration.prototype.setPort = function (newValue) {
            this.port = newValue;
            return this;
        };
        Configuration.prototype.getPropsPath = function () {
            return this.propsPath;
        };
        Configuration.prototype.setPropsPath = function (newValue) {
            this.propsPath = newValue;
            return this;
        };
        Configuration.readFromFile = function readFromFile(path) {
            var obj = JSON.parse(fs.readFileSync(path, 'utf8'));
            var returnObj = new Configuration();
            for(var prop in obj) {
                if(obj.hasOwnProperty(prop)) {
                    returnObj[prop] = obj[prop];
                }
            }
            return returnObj;
        }
        Configuration.prototype.writeToFile = function (path) {
            fs.writeFileSync(path, JSON.stringify(this, null, "  "), 'utf8');
        };
        return Configuration;
    })();
    NLPConfig.Configuration = Configuration;    
})(exports.NLPConfig || (exports.NLPConfig = {}));


