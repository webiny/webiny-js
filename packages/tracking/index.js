const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const request = require("request");
const get = require("lodash.get");

let config;
const defaultLogger = () => {};

const sendStats = (action, data) => {
    return new Promise(resolve => {
        request.post(
            {
                url: "https://stats.webiny.com/track",
                json: { action, data }
            },
            resolve
        );
    });
};

const loadConfig = async ({ logger = defaultLogger } = {}) => {
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

        logger(`Loaded user ID: ${config.id}`);
        logger(`Tracking is ${config.tracking ? "ENABLED" : "DISABLED"}`);
    }
};

const trackComponent = async ({ context, component, method = "deploy" }) => {
    try {
        await loadConfig({ logger: context.debug });

        if (config.tracking !== true) {
            return;
        }

        const { name, version } = readJson.sync(path.join(path.dirname(component), "package.json"));
        context.debug(`Tracking component: ${name} (${method})`);
        await sendStats("telemetry", {
            type: "component",
            user: config.id,
            instance: get(context, "instance.id") || "",
            component: name,
            version,
            method
        });
    } catch (e) {
        // Ignore errors
    }
};

const trackActivity = async ({ cliVersion, type, activityId, context = {} }) => {
    if (!cliVersion) {
        throw new Error(`Cannot track activity - "cliVersion" not specified.`);
    }

    if (!type) {
        throw new Error(`Cannot track activity - "type" not specified.`);
    }

    if (!activityId) {
        throw new Error(`Cannot track activity - "activityId" not specified.`);
    }

    try {
        await loadConfig({ logger: context.debug });

        if (config.tracking !== true) {
            return;
        }

        await sendStats("activities", {
            version: cliVersion,
            type,
            activityId,
            instance: get(context, "instance.id") || "",
            user: config.id
        });
    } catch (e) {
        // Ignore errors
    }
};

const trackError = async ({ cliVersion, type, errorMessage, errorStack, activityId, context = {} }) => {
    if (!cliVersion) {
        throw new Error("Cannot track activity - CLI version not specified.");
    }

    if (!type) {
        throw new Error("Cannot track activity - type not specified.");
    }

    if (!errorMessage) {
        throw new Error("Cannot track activity - CLI version not specified.");
    }

    try {
        await loadConfig({ logger: context.debug });

        if (config.tracking !== true) {
            return;
        }

        await sendStats("errors", {
            version: cliVersion,
            type,
            errorMessage,
            errorStack,
            activityId,
            instance: get(context, "instance.id") || "",
            user: config.id
        });
    } catch (e) {
        // Ignore errors
    }
};

module.exports = {
    trackComponent,
    trackActivity,
    trackError
};
