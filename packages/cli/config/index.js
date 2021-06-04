const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const { v4: uuidv4 } = require("uuid");

const configPath = path.join(os.homedir(), ".webiny", "config");

let config;

const verifyConfig = async () => {
    // Check user ID
    try {
        config = await readJson(configPath);
        if (!config.id) {
            throw Error("Invalid Webiny config!");
        }
    } catch (e) {
        // A new config file is written if it doesn't exist or is invalid.
        config = { id: uuidv4() };
        await writeJson(configPath, config);
    }

    return config;
};

const getId = () => {
    return config.id;
};

const setTracking = async enabled => {
    try {
        const config = readJson.sync(configPath);
        if (!config.id) {
            config.id = uuidv4();
        }
        config.tracking = enabled;
        writeJson.sync(configPath, config);
    } catch (e) {
        // A new config file is written if it doesn't exist.
        writeJson.sync(configPath, { id: uuidv4(), tracking: enabled });
    }
};

module.exports = { verifyConfig, getId, setTracking };
