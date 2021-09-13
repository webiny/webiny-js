const baseSendEvent = require("./sendEvent");

const setProperties = data => {
    return sendEvent("$identify", data);
};

const sendEvent = (event, data = {}) => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
        return;
    }

    let properties = {};
    let extraPayload = {};
    if (event !== "$identify") {
        properties = data;
    } else {
        extraPayload = {
            $set: data
        };
    }

    return baseSendEvent({
        event,
        properties,
        extraPayload,
        user: process.env.REACT_APP_USER_ID,
        version: process.env.REACT_APP_WEBINY_VERSION
    });
};

module.exports = { setProperties, sendEvent };
