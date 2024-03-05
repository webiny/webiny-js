const { globalConfig } = require("@webiny/global-config");
const isCI = require("is-ci");
const { WTS } = require("wts/src/node");
const baseSendEvent = require("./sendEvent");

const sendEvent = async ({ event, user, version, properties }) => {
    const shouldSend = isEnabled();
    if (!shouldSend) {
        return;
    }

    const wts = new WTS();

    return baseSendEvent({
        event,
        user: user || globalConfig.get("id"),
        properties: {
            ...properties,
            version: version || require("./package.json").version,
            ci: isCI,
            newUser: Boolean(globalConfig.get("newUser"))
        },
        wts
    });
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
