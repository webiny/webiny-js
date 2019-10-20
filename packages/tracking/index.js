const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const request = require("request");

const prefix = "[Webiny]";

let config;
const defaultLogger = () => {};

const sendStats = data => {
    return new Promise(resolve => {
        request.post(
            {
                url: "https://stats.webiny.com/track",
                json: data
            },
            resolve
        );
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

const trackComponent = async ({ context, component, method = "deploy" }) => {
    try {
        await loadConfig({ logger: context.debug });

        if (config.tracking !== true) {
            return;
        }

        const { name, version } = readJson.sync(path.join(path.dirname(component), "package.json"));
        context.debug(`${prefix} Tracking component: ${name} (${method})`);
        await sendStats({
            type: "component",
            user: config.id,
            instance: context.instance.id,
            component: name,
            version,
            method
        });
    } catch (e) {
        // Ignore errors
    }
};

const trackProject = async ({ cliVersion }) => {
    try {
        await loadConfig();

        if (config.tracking !== true) {
            return;
        }

        await sendStats({
            type: "project",
            user: config.id,
            version: cliVersion
        });
    } catch (e) {
        // Ignore errors
    }
};

module.exports = {
    trackProject,
    trackComponent
};
