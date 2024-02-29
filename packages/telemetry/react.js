const createSendEvent = require("./sendEvent");

/**
 *
 * @param event {String}
 * @param properties {Record<string, string>}
 * @return {Promise<T>}
 */
const sendEvent = (event, properties = {}) => {

    const shouldSend = process.env.REACT_APP_WEBINY_TELEMETRY !== "false";

    const sendTelemetry = createSendEvent({
        event,
        properties,
        user: process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID,
        newUser: REACT_APP_WEBINY_TELEMETRY_NEW_USER === "true",
        version: process.env.REACT_APP_WEBINY_VERSION,
        ci: process.env.REACT_APP_IS_CI === "true",
    });

    return shouldSend ? sendTelemetry() : Promise.resolve();
};

module.exports = { setProperties, sendEvent };
