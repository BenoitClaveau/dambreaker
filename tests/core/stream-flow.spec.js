/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const fs = require("fs");
const { promisify } = require("util");
const {
    ArrayToStream,
    StreamWorkflow,
    getAll
} = require("../../lib/streams");
const {
    JsonStream,
    Json
} = require("../../lib/services/core");
const {
    Transform,
    pipeline
} = require('stream');
const pipelineAsync = promisify(pipeline);

describe("stream-workflow", () => {

    it("create a StreamWorkflow", async () => {
        const transform1 = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                //console.log("\t", chunk.key);
                callback(null, {
                    ...chunk,
                    key: chunk.key.toUpperCase()
                });
            }
        })

        const transform2 = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                //console.log("\t\t", chunk.key);
                callback(null, {
                    ...chunk,
                    key: chunk.key.replace(/ /g, ";")
                });
            }
        })

        const flow = new StreamWorkflow({
            objectMode: true,
            init(stream) {
                return pipeline(
                    stream,
                    transform1,
                    transform2,
                    error => error && this.emit("error", error)
                )
            }
        });

        let cpt = 0;
        const all = await getAll(
            fs.createReadStream(`${__dirname}/../data/npm.array.json`)
                .pipe(new JsonStream(new Json()).parse())
                .pipe(flow)
                .pipe(new Transform({
                    objectMode: true,
                    transform(chunk, enc, cb) {
                        cb(null, chunk);
                    }
                }))
                .on("data", data => {
                    cpt++;
                    //console.log(data.key);
                    if (cpt == 100) {
                        //console.log("** PAUSE **");
                        transform1.pause();
                        setTimeout(() => {
                            //console.log("** RESUME **");
                            transform1.resume();
                        }, 2000);
                    }
                })
        )
        expect(all.length).to.be(4028);
        expect(all[1]).to.eql({
            id: "3scale",
            key: "3SCALE",
            value: {
                rev: "3-db3d574bf0ecdfdf627afeaa21b4bdaa"
            }
        });
        expect(all[4027]).to.eql({
            id: "zutil",
            key: "ZUTIL",
            value: {
                rev: "9-3e7bc6520008b4fcd5ee6eb9e8e5adf5"
            }
        });
    }).timeout(30000);

    it("throw an error in a StreamWorkflow pipe()", async () => {
        const stream = new ArrayToStream(["Execute multiples", "pipes inside", "a stream"]);
        const flow = new StreamWorkflow({
            objectMode: true,
            init(stream) {
                return stream
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk == "pipes inside")
                                callback(new Error("Test"))
                            else callback(null, chunk.toUpperCase());
                        }
                    })).on("error", error => this.emit("error", error))
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(null, chunk);
                        }
                    }))
            }
        });

        try {
            await pipelineAsync(stream, flow);
            throw new Error();
        }
        catch (error) {
            expect(error.message).to.be("Test");
        }
    }).timeout(20000);

    it("throw an error in a StreamWorkflow pipeline mid", async () => {
        const stream = new ArrayToStream(["Execute multiples", "pipes inside", "a stream"]);
        const flow = new StreamWorkflow({
            objectMode: true,
            init(stream) {
                return pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(null, chunk);
                        }
                    }),
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk == "pipes inside")
                                callback(new Error("Test"))
                            else callback(null, chunk.toUpperCase());
                        }
                    }),
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(null, chunk);
                        }
                    }),
                    error => {
                        if (error) this.emit("error", error);
                    }
                );
            }
        });

        try {
            await pipelineAsync(stream, flow);
            throw new Error();
        }
        catch (error) {
            expect(error.message).to.be("Test");
        }
    });

    it("throw an error in a StreamWorkflow pipeline first", async () => {
        const stream = new ArrayToStream(["Execute multiples", "pipes inside", "a stream"]);
        const flow = new StreamWorkflow({
            objectMode: true,
            init(stream) {
                return pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk == "pipes inside")
                                callback(new Error("Test"))
                            else callback(null, chunk.toUpperCase());
                        }
                    }),
                    error => {
                        if (error) this.emit("error", error);
                    }
                );
            }
        });

        try {
            await pipelineAsync(stream, flow);
            throw new Error();
        }
        catch (error) {
            expect(error.message).to.be("Test");
        }
    });

    it("throw an error in a StreamWorkflow pipeline last", async () => {
        const stream = new ArrayToStream(["Execute multiples", "pipes inside", "a stream"]);
        const flow = new StreamWorkflow({
            objectMode: true,
            init(stream) {
                return pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(null, chunk);
                        }
                    }),
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk == "pipes inside")
                                callback(new Error("Test"))
                            else callback(null, chunk.toUpperCase());
                        }
                    }),
                    error => {
                        if (error) this.emit("error", error);
                    }
                );
            }
        });

        try {
            await pipelineAsync(stream, flow);
            throw new Error();
        }
        catch (error) {
            expect(error.message).to.be("Test");
        }
    });
})
