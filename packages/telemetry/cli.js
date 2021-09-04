const { sendEvent: baseSendEvent } = require("./index");
const { globalConfig } = require("./utils");

module.exports.sendEvent = ({ event, user, version, properties, extraPayload }) => {
    const config = globalConfig.get();

    // Check both `telemetry` and `tracking` for backwards compatibility
    if (!globalConfig.telemetry) {
        return;
    }

    return baseSendEvent({
        event,
        user: user || config.id,
        version: version || require("./package.json").version,
        properties,
        extraPayload
    });
};
