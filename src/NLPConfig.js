var osProcess = require("child_process");
var path = require("path");
(function (NLPConfig) {
    var Config = (function () {
        function Config() { }
        Config.prototype.getConfig = function () {
            this.config = require('../config.json');
            return this.config;
        };
        return Config;
    })();
    NLPConfig.Config = Config;    
})(exports.NLPConfig || (exports.NLPConfig = {}));


