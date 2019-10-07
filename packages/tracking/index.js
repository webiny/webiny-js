const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const request = require("request");

const prefix = "[Webiny]";

let config;
const defaultLogger = () => {};

const sendStats = data => {
    return new Promise(resolve => {
        request.post("http://stats.webiny.com/track", { json: data }, resolve);
    });
};

const loadConfig = async ({ logger = defaultLogger }) => {
    if (!config) {
        const dataPath = path.join(os.homedir(), ".webiny", "config");
        try {
            config = readJson.sync(dataPath);
            if (!config.id) {
                config.id = "unknown";
            }
        } catch (e) {
            config = { id: "unknown", tracking: true };
        }

        logger(`${prefix} Loaded user ID: ${config.id}`);
        logger(`${prefix} Tracking is ${config.tracking ? "ENABLED" : "DISABLED"}`);
    }
};

const trackComponent = async ({ context, component, method = "deploy", track = true }) => {
    if (track === false) {
        return;
    }

    await loadConfig({ logger: context.debug });

    if (config.tracking !== true) {
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

    if (config.tracking !== true) {
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
