/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Auth2 = require("../../lib/services/auth2");
const DamLess = require("../../index");
const expect = require("expect.js");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

describe("auth2", () => {

    let damless;
    before(async () => {
        damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}})
        await damless.start();
    });
    after(async () => await damless.stop());

    xit("authenticate", async () => {
    });

});