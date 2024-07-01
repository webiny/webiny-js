const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".webiny", "config");

module.exports.globalConfig = {
    __globalConfig: null,
    get(key) {
        try {
            if (!this.__globalConfig) {
                this.__globalConfig = readJson.sync(GLOBAL_CONFIG_PATH);
                if (!this.__globalConfig.id) {
                    throw Error("Invalid Webiny config!");
                }
            }
        } catch (e) {
            // A new config file is written if it doesn't exist or is invalid.
            this.__globalConfig = {
                id: uuidv4(),
                telemetry: true,

                // This flag is set to `false` the moment user successfully
                // deploys a Webiny project for the first time. Once they do,
                // they're considered no longer a "new user".
                newUser: true
            };
            writeJson.sync(GLOBAL_CONFIG_PATH, this.__globalConfig);
        }

        return key ? this.__globalConfig[key] : this.__globalConfig;
    },
    set(key, value) {
        const globalConfig = this.get();
        globalConfig[key] = value;
        writeJson.sync(GLOBAL_CONFIG_PATH, globalConfig);
        return globalConfig;
    }
};
