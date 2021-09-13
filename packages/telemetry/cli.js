const baseSendEvent = require("./sendEvent");
const { globalConfig } = require("@webiny/global-config");

const sendEvent = ({ event, user, version, properties, extraPayload }) => {
    if (!isEnabled()) {
        return;
    }

    return baseSendEvent({
        event,
        user: user || globalConfig.get("id"),
        version: version || require("./package.json").version,
        properties,
        extraPayload
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

    return config.tracking !== false;


};

module.exports = { sendEvent, enable, disable, isEnabled };
