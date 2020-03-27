const fs = require("fs-extra");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const debug = require("debug")("webiny");
const { Status } = require("./Status");

const randomId = () =>
    Math.random()
        .toString(36)
        .substring(6);

class Context {
    constructor(config) {
        this.stateRoot = path.resolve(".webiny");
        this.envStateRoot = path.resolve(".webiny", config.env);

        this.credentials = config.credentials || {};
        this.debugMode = config.debug || false;
        this.state = {
            id: randomId()
        };
        this.id = this.state.id;

        // Event Handler: Control + C
        process.on("SIGINT", async () => {
            this._status.stop("cancel");
            process.exit(1);
        });

        this._status = new Status();
        this._status.start();
    }

    async init() {
        const contextStatePath = path.join(this.stateRoot, `_.json`);

        if (fs.existsSync(contextStatePath)) {
            this.state = await loadJsonFile(contextStatePath);
        } else {
            await writeJsonFile(contextStatePath, this.state);
        }
        this.id = this.state.id;
    }

    resourceId() {
        return `${this.id}-${randomId()}`;
    }

    async readState(id) {
        const stateFilePath = path.join(this.envStateRoot, `${id}.json`);
        if (fs.existsSync(stateFilePath)) {
            return loadJsonFile(stateFilePath);
        }
        return {};
    }

    async writeState(id, state) {
        const stateFilePath = path.join(this.envStateRoot, `${id}.json`);
        if (Object.keys(state).length === 0) {
            await fs.unlink(stateFilePath);
        } else {
            await writeJsonFile(stateFilePath, state);
        }
        return state;
    }

    log(...args) {
        debug(...args);
    }

    debug(...args) {
        debug(...args);
    }

    status(status, entity) {
        this._status.render(status, entity);
    }

    clearStatus() {
        this._status.clearStatus();
    }
}

module.exports = { Context };
