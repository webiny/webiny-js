const os = require("os");
const path = require("path");
const uuid = require("uuid/v4");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const request = require("request");

const prefix = "[Webiny]";

let config;

module.exports = ({ context, component, method = "deploy", track = true }) => {
    if (track === false) {
        return;
    }

    if (!config) {
        const dataPath = path.join(os.homedir(), ".webiny", "config");
        let userId, trackingDisabled;
        try {
            config = readJson.sync(dataPath);
            userId = config.id;
            if (!userId) {
                throw Error("Invalid Webiny config!");
            }
            trackingDisabled = Boolean(config.trackingDisabled);
            context.debug(`${prefix} Loaded existing config, user ID: ${userId}`);
        } catch (e) {
            userId = uuid();
            trackingDisabled = false;
            context.debug(`${prefix} Created new config, user ID: ${userId}`);
            writeJson.sync(dataPath, { id: userId });
            config = { id: userId, trackingDisabled };
        }

        context.debug(`${prefix} Tracking is ${trackingDisabled ? "DISABLED" : "ENABLED"}`);
    }

    if (config.trackingDisabled) {
        return;
    }

    context.debug(`${prefix} Tracking component: ${component} (${method})`);

    const data = {
        user: config.id,
        instance: context.instance.id,
        component,
        method
    };

    return new Promise(resolve => {
        request.post("http://18.223.190.136/track", { json: data }, resolve);
    });
};
