var fs = require("fs");
var tempFilePath = "/Users/hewett/tmp/testObj.json";
var TestObj = (function () {
    function TestObj(num, s1, a1) {
        this.num = num || 42;
        this.s1 = s1 || "Mike";
        this.a1 = a1 || [
            1, 
            2, 
            3, 
            4, 
            5
        ];
    }
    TestObj.prototype.getNum = function () {
        return this.num;
    };
    TestObj.prototype.getS1 = function () {
        return this.s1;
    };
    TestObj.prototype.getA1 = function () {
        return this.a1;
    };
    TestObj.readFromFile = function readFromFile(path) {
        var obj = JSON.parse(fs.readFileSync(path, 'utf8'));
        var returnObj = new TestObj();
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                returnObj[prop] = obj[prop];
            }
        }
        return returnObj;
    }
    return TestObj;
})();
var test1 = new TestObj();
var test2 = TestObj.readFromFile(tempFilePath);
console.log(typeof (test2));
console.log(JSON.stringify(test2, null, "  "));
console.log(test2.getS1());
