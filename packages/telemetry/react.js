const createSendEvent = require("./sendEvent");

const setProperties = data => {
    return sendEvent("$identify", data);
};
/**
 *
 * @param event {String}
 * @param data {Record<string, string>}
 * @return {Promise<T>}
 */
const sendEvent = (event, data = {}) => {
    let properties = {};
    let extraPayload = {};
    if (event !== "$identify") {
        properties = data;
    } else {
        extraPayload = {
            $set: data
        };
    }

    const shouldSend = process.env.REACT_APP_WEBINY_TELEMETRY !== "false";

    const sendTelemetry = createSendEvent({
        event,
        properties,
        extraPayload,
        user: process.env.REACT_APP_USER_ID,
        version: process.env.REACT_APP_WEBINY_VERSION
    });

    return shouldSend ? sendTelemetry() : Promise.resolve();
};

module.exports = { setProperties, sendEvent };
