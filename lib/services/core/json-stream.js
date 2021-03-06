/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError } = require('oups');
const { Transform } = require('stream');
const JsonParser = require('jsonparse');

class Stringify extends Transform {
    constructor(json, isArray = true, source) {
        super({ objectMode: true });
        this.json = json;
        this.isArray = isArray;
        this.source = source;

        this.op = '[';
        this.sep = ',';
        this.cl = ']';
        
        this.first = true;
    };

    _transform(chunk, encoding, callback) {
        try {
            let json;

            if (Buffer.isBuffer(chunk)) json = chunk.toString(encoding);
            else if (typeof chunk == "string") json = chunk;
            else json = this.json.stringify(chunk, this.source);

            if (this.isArray) {
                if (this.first) { 
                    this.first = false; 
                    this.push(this.op)
                    this.push(json);
                    callback();
                }
                else {
                    this.push(this.sep)
                    this.push(json);
                    callback();
                }
            }
            else {
                if (this.first) {
                    this.first = false; 
                    this.push(json);
                    callback();
                }
                else {
                    callback(); //do not push beacause isArray is false
                }
            }
        } 
        catch (error) {
            callback(error);
        }
    }

    _flush(callback) {
        if(this.isArray) {
            if(this.first) this.push(this.op)
            this.push(this.cl);
        }
        callback();
      };

};

class Parser extends Transform {
    constructor(json, source) {
        super({ objectMode: true })
        this.json = json;
        this.source = source;

        this.parser = new JsonParser();
        this.mode = "object";
        this.first = true;

        this.parser.onValue = (value) => {
            if (this.parser.mode == JsonParser.C.ARRAY && this.parser.stack.length == 1) {
                this.mode = "array";
                this.onObject(value);
            }
            if (this.parser.stack.length == 0 && this.mode != "array") {
                this.onObject(value);
            }
            else {
                const typedValue = this.onOther(this.parser.key, value);
                if (value !== typedValue) this.parser.value[this.parser.key] = typedValue;
            }
        }
    }

    _transform(chunk, encoding, callback) {
        try {
            if (this.first) {
                this.first = false;
                this.emit("mode", this.mode);
            }
            if (Buffer.isBuffer(chunk)) this.parser.write(chunk); // write is synchrone
            else if (typeof chunk == "object") this.push(chunk);
            else this.parser.write(chunk); // write is synchrone
            callback();
        }
        catch (error) {
            callback(error);
        }
    }

    onValue(key, value) {
        return this.json.reviver(key, value, this.source);
    }

    onOther(key, value) {
        return this.onValue(key, value);
    }

    onObject(obj) {
        this.push(obj);
    }
}

class JsonStreamService {
    constructor(json) {
        if (!json) throw new UndefinedError("json");
        this.json = json;
    }

    stringify(options = {}) {
        const { isArray, source } = options;
        return new Stringify(this.json, isArray, source);
    }

    parse(options = {}) {
        const { source } = options;
        return new Parser(this.json, source);
    }
}

exports = module.exports = JsonStreamService;