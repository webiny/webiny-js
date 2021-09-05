const baseSendEvent = require("./sendEvent");

const setProperties = data => {
    return sendEvent("$identify", data);
};

const sendEvent = (event, data = {}) => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
        return;
    }

    let properties = {};
    let extraPayloadProperties = {};
    if (event !== "$identify") {
        properties = data;
    } else {
        extraPayloadProperties = {
            $set: data
        };
    }

    return baseSendEvent({
        event,
        properties,
        extraPayloadProperties,
        user: process.env.REACT_APP_USER_ID,
        version: process.env.REACT_APP_WEBINY_VERSION
    });
};

module.exports = { setProperties, sendEvent };
