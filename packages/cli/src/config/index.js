const os = require("os");
const path = require("path");
const uuid = require("uuid/v4");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");

const configPath = path.join(os.homedir(), ".webiny", "config");

const verifyConfig = () => {
    // Check user ID
    try {
        const config = readJson.sync(configPath);
        if (!config.id) {
            throw Error("Invalid Webiny config!");
        }
    } catch (e) {
        // A new config file is written if it doesn't exist or is invalid.
        writeJson.sync(configPath, { id: uuid(), tracking: true });
    }
};

module.exports = { verifyConfig };
