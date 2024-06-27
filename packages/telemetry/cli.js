const { globalConfig } = require("@webiny/global-config");
const isCI = require("is-ci");
const { WTS } = require("wts-client/node");
const baseSendEvent = require("./sendEvent");

const sendEvent = async ({ event, user, version, properties }) => {
    const shouldSend = isEnabled();
    if (!shouldSend) {
        return;
    }

    const wts = new WTS();

    const wcpProperties = {};
    const [wcpOrgId, wcpProjectId] = getWcpOrgProjectId();
    if (wcpOrgId && wcpProjectId) {
        wcpProperties.wcpOrgId = wcpOrgId;
        wcpProperties.wcpProjectId = wcpProjectId;
    }

    return baseSendEvent({
        event,
        user: user || globalConfig.get("id"),
        properties: {
            ...properties,
            ...wcpProperties,
            version: version || require("./package.json").version,
            ci: isCI,
            newUser: Boolean(globalConfig.get("newUser"))
        },
        wts
    });
};

const getWcpOrgProjectId = () => {
    // In CLI, WCP project ID is stored in the `WCP_PROJECT_ID` environment variable.
    const id = process.env.WCP_PROJECT_ID;
    if (typeof id === "string") {
        return id.split("/");
    }
    return [];
};

const enable = () => {
    globalConfig.set("telemetry", true);
};

const disable = () => {
    globalConfig.set("telemetry", false);
};

const isEnabled = () => {
    const config = globalConfig.get();

    if (config.telemetry === false) {
        return false;
    }

    // `tracking` is left here for backwards compatibility with previous versions of Webiny.
    return config.tracking !== false;
};

module.exports = { sendEvent, enable, disable, isEnabled };
