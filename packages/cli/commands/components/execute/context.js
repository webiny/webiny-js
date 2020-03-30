const fs = require("fs-extra");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const { Status } = require("./Status");

const randomId = () =>
    Math.random()
        .toString(36)
        .substring(6);

class Context {
    constructor(config) {
        this.logger = config.logger;
        this.stateRoot = config.stateRoot;
        this.credentials = config.credentials || {};
        this.debugMode = config.debug || false;
        this.state = { id: config.id };
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
        // keep this for compatibility with other @serverless/components
    }

    /**
     * This method is used by @serverless/{component-name} components
     * so we need to keep it for compatibility.
     * @returns {string}
     */
    resourceId() {
        return `${this.id}-${randomId()}`;
    }

    async readState(id) {
        const stateFilePath = path.join(this.stateRoot, `${id}.json`);
        if (fs.existsSync(stateFilePath)) {
            return loadJsonFile(stateFilePath);
        }
        return {};
    }

    async writeState(id, state) {
        const stateFilePath = path.join(this.stateRoot, `${id}.json`);
        if (Object.keys(state).length === 0) {
            await fs.unlink(stateFilePath);
        } else {
            await writeJsonFile(stateFilePath, state);
        }
        return state;
    }

    log(...args) {
        this.logger.log(...args);
    }

    debug(...args) {
        this.logger.debug(...args);
    }

    status(status, entity) {
        this._status.render(status, entity);
    }

    clearStatus() {
        this._status.clearStatus();
    }
}

module.exports = { Context };
