const createSendEvent = require("./sendEvent");
const { globalConfig } = require("@webiny/global-config");
const isCI = require('is-ci');

const sendEvent = ({ event, user, version, properties, extraPayload }) => {
    const shouldSend = isEnabled();

    try {
        const sendTelemetry = createSendEvent({
            event,
            user: user || globalConfig.get("id"),
            newUser: Boolean(globalConfig.get("newUser")),
            version: version || require("./package.json").version,
            ci: isCI,
            properties,
            extraPayload
        });

        if (shouldSend) {
            return sendTelemetry();
        }
    } catch (err) {
        // Ignore errors if telemetry is disabled.
        if (!shouldSend) {
            return;
        }

        throw err;
    }
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
