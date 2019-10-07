const os = require("os");
const path = require("path");
const uuid = require("uuid/v4");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const request = require("request");

const prefix = "[Webiny]";

let config;
const defaultLogger = () => {};

const sendStats = data => {
    return new Promise(resolve => {
        request.post("http://18.223.190.136/track", { json: data }, resolve);
    });
};

const loadConfig = async ({ logger = defaultLogger }) => {
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
            logger(`${prefix} Loaded existing config, user ID: ${userId}`);
        } catch (e) {
            userId = uuid();
            trackingDisabled = false;
            logger(`${prefix} Created new config, user ID: ${userId}`);
            writeJson.sync(dataPath, { id: userId });
            config = { id: userId, trackingDisabled };
        }

        logger(`${prefix} Tracking is ${trackingDisabled ? "DISABLED" : "ENABLED"}`);
    }
};

const trackComponent = async ({ context, component, method = "deploy", track = true }) => {
    if (track === false) {
        return;
    }

    await loadConfig({ logger: context.debug });

    if (config.trackingDisabled) {
        return;
    }

    context.debug(`${prefix} Tracking component: ${component} (${method})`);

    return sendStats({
        type: "component",
        user: config.id,
        instance: context.instance.id,
        component,
        method
    });
};

const trackProject = async () => {
    await loadConfig();

    if (config.trackingDisabled) {
        return;
    }

    return sendStats({
        type: "project",
        user: config.id
    });
};

module.exports = {
    trackProject,
    trackComponent
};
