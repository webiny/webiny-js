const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".webiny", "config");

let globalConfig;

function getGlobalConfig(key) {
    try {
        globalConfig = readJson.sync(GLOBAL_CONFIG_PATH);
        if (!globalConfig.id) {
            throw Error("Invalid Webiny config!");
        }
    } catch (e) {
        // A new config file is written if it doesn't exist or is invalid.
        globalConfig = { id: uuidv4(), telemetry: true };
        writeJson.sync(GLOBAL_CONFIG_PATH, globalConfig);
    }

    return key ? globalConfig[key] : globalConfig;
}

module.exports = {
    get(key) {
        return getGlobalConfig(key);
    },
    set(key, value) {
        const globalConfig = getGlobalConfig();
        globalConfig[key] = value;
        writeJson.sync(GLOBAL_CONFIG_PATH, globalConfig);
        return globalConfig;
    },
    // Created this getter just for backwards compatibility (we need to check the old "tracking" property too).
    get telemetry() {
        const config = getGlobalConfig();
        return config.telemetry !== false || config.tracking !== false;
    }
};
