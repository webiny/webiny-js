const baseSendEvent = require("./sendEvent");
const { WTS } = require("wts/src/admin");

const sendEvent = async (event, properties = {}) => {
    const shouldSend = process.env.REACT_APP_WEBINY_TELEMETRY !== "false";
    if (!shouldSend) {
        return;
    }

    const wts = new WTS();

    return baseSendEvent({
        event,
        user: process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID,
        properties: {
            ...properties,
            version: process.env.REACT_APP_WEBINY_VERSION,
            ci: process.env.REACT_APP_IS_CI === "true",
            newUser: "false"
        },
        wts
    });
};

module.exports = { sendEvent };
