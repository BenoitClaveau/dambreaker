/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const path = require("path");
const GiveMeTheService = require("givemetheservice");
const EventEmitter = require("events");

class DamLessServer {

    constructor(options = {}) {
        options.config = options.config || "./damless.json";
        this.commands = [];
        this.eventEmitter = new EventEmitter();
        this.giveme = new GiveMeTheService({ dirname: options.dirname }); // Create the container
        const config = typeof options.config == "object" ? options.config : require(path.resolve(this.giveme.root, options.config));

        // inject all core services
        this.giveme.inject("config", config);
        this.giveme.inject("eventEmitter", this.eventEmitter);
        this.giveme.inject("services-loader", `${__dirname}/lib/services/core/services-loader`); // Need to be on top of injected services. services-loader constructor will inject others services. But services-loader constructor is calling after load. So default service will be overrideed.
        this.giveme.inject("fs", `${__dirname}/lib/services/core/fs`);
        this.giveme.inject("event", `${__dirname}/lib/services/core/event`);
        this.giveme.inject("json", `${__dirname}/lib/services/core/json`);
        this.giveme.inject("json-stream", `${__dirname}/lib/services/core/json-stream`);
        this.giveme.inject("qjimp", `${__dirname}/lib/services/core/qjimp`);
        this.giveme.inject("client", `${__dirname}/lib/services/core/client`);
        this.giveme.inject("walk", `${__dirname}/lib/services/core/walk`);
        this.giveme.inject("crypto", `${__dirname}/lib/services/core/crypto`);
        this.giveme.inject("password", `${__dirname}/lib/services/core/password`);
        this.giveme.inject("repository-factory", `${__dirname}/lib/services/core/repository-factory`);
        this.giveme.inject("damless", `${__dirname}/lib/damless`);
        this.giveme.inject("middleware", `${__dirname}/lib/services/middleware`); // After damless beacause http-router must be created.
    }

    /**
     * Apply all configuration commands sequentially
     */
    async apply() {
        let fn;
        while ((fn = this.commands.shift()) !== undefined) {
            await fn();
        }
    }

    /**
     * Add a configuration command
     */
    async addCommand(fn) {
        this.commands.push(fn);
    }

    async start() {
        await this.apply();
        await this.giveme.load();
    }

    async stop() {
        await this.giveme.unload();
    }

    async resolve(name, options) {
        return await this.giveme.resolve(name, options);
    }

    config(fn) {
        fn(this.giveme.config);
        return this;
    }

    inject(name, location, options) {
        this.giveme.inject(name, location, options);
        return this;
    }

    get(route, service, method, options) {
        this.addCommand(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.get(route, service, method, options);
        });
        return this;
    }

    post(route, service, method, options) {
        this.addCommand(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.post(route, service, method, options);
        });
        return this;
    }

    put(route, service, method, options) {
        this.addCommand(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.put(route, service, method, options);
        });
        return this;
    }

    delete(route, service, method, options) {
        this.addCommand(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.delete(route, service, method, options);
        });
        return this;
    }

    patch(route, service, method, options) {
        this.addCommand(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.patch(route, service, method, options);
        });
        return this;
    }

    asset(route, filepath) {
        this.addCommand(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.asset(route, filepath);
        });
        return this;
    }

    use(middlewareName) {
        this.addCommand(async () => {
            const middleware = await this.resolve("middleware", { mount: false });
            middleware.push(middlewareName);
        });
        return this;
    }

    on(type, listener) {
        this.eventEmitter.on(type, listener);
        return this;
    }
}

const {
    Client,
    Crypto: CryptoService,
    Event: EventService,
    FS,
    JsonStream,
    Json,
    Password,
    QJimp,
    RepositoryFactory,
    String: StringService,
    Walk
} = require('./lib/services/core');

const {
    AskReply,
    CompressedStream,
    ContentType,
    ContextFactory,
    IsItForMe,
    QueryString,
    QueryParams,
    Middlewares
} = require('./lib/services');

const {
    AuthJWT,
    ForwardToAsset,
    OAuth2
} = require('./lib/services/middlewares');

const {
    transform,
    streamify,
    noop,
    getFirst,
    getAll,
    getBuffer,
    ending,
    ArrayToStream,
    StreamFlow
} = require('./lib/core');

module.exports = DamLessServer;
// Export givemetheservice services
module.exports.Client = Client;
module.exports.Crypto = CryptoService;
module.exports.Event = EventService;
module.exports.FS = FS;
module.exports.JsonStream = JsonStream;
module.exports.Json = Json;
module.exports.Password = Password;
module.exports.QJimp = QJimp;
module.exports.RepositoryFactory = RepositoryFactory;
module.exports.String = StringService;
module.exports.Walk = Walk;
// Export damless services
module.exports.AskReply = AskReply;
module.exports.CompressedStream = CompressedStream;
module.exports.ContentType = ContentType;
module.exports.ContextFactory = ContextFactory;
module.exports.IsItForMe = IsItForMe;
module.exports.QueryString = QueryString;
module.exports.QueryParams = QueryParams;
module.exports.Middlewares = Middlewares;
// Export damless middleware
module.exports.AuthJWT = AuthJWT;
module.exports.ForwardToAsset = ForwardToAsset;
module.exports.OAuth2 = OAuth2;
// Export damless core
module.exports.transform = transform;
module.exports.streamify = streamify;
module.exports.getFirst = getFirst;
module.exports.getAll = getAll;
module.exports.getBuffer = getBuffer;
module.exports.ending = ending;
module.exports.noop = noop;
module.exports.ArrayToStream = ArrayToStream;
module.exports.StreamFlow = StreamFlow;
