// This file tests reading and writing of TypeScript objects to/from a file.
// mh: 10 Nov 2012

declare var require;

var fs = require("fs");
var tempFilePath = "/Users/hewett/tmp/testObj.json"; 



class TestObj {
    private num: number;
    private s1: string;
    private a1: number[];
    
    constructor (num?: number, s1?: string, a1?: number[]) {
        this.num = num || 42;
        this.s1  = s1 || "Mike";
        this.a1 = a1 || [1, 2, 3, 4, 5];
    }
    
    public getNum() {
        return this.num;
    }
    
    public getS1() {
        return this.s1;
    }
    
    public getA1() {
        return this.a1;
    }
    
    static readFromFile(path: string) : TestObj {
        var obj: TestObj = <TestObj>JSON.parse(fs.readFileSync(path, 'utf8'));
        
        // Create a new testObj and copy the fields over
        var returnObj = new TestObj();
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                returnObj[prop] = obj[prop];
            }
        }
        
        return returnObj;
    }
     
}


var test1 = new TestObj();

//console.log(JSON.stringify(test1, null, "  "));

// fs.writeFileSync(tempFilePath, JSON.stringify(test1, null, "  "));

var test2: TestObj = TestObj.readFromFile(tempFilePath);

console.log(typeof(test2));
console.log(JSON.stringify(test2, null, "  "));
console.log(test2.getS1());

