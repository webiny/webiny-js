const { sendEvent: baseSendEvent } = require("./index");
const { isEnabled } = require(".");

module.exports.sendEvent = ({ event, user, version, properties, extraPayload }) => {
    // Check both `telemetry` and `tracking` for backwards compatibility.
    if (!isEnabled()) {
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
