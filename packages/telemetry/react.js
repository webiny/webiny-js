const baseSendEvent = require("./sendEvent");
const { WTS } = require("wts/src/admin");

const sendEvent = async (event, properties = {}) => {
    const shouldSend = process.env.REACT_APP_WEBINY_TELEMETRY !== "false";
    if (!shouldSend) {
        return;
    }

    const wts = new WTS();

    const wcpProperties = {};
    const [wcpOrgId, wcpProjectId] = getWcpOrgProjectId();
    if (wcpOrgId && wcpProjectId) {
        wcpProperties.wcpOrgId = wcpOrgId;
        wcpProperties.wcpProjectId = wcpProjectId;
    }

    return baseSendEvent({
        event,
        user: process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID,
        properties: {
            ...properties,
            ...wcpProperties,
            version: process.env.REACT_APP_WEBINY_VERSION,
            ci: process.env.REACT_APP_IS_CI === "true",
            newUser: process.env.REACT_APP_WEBINY_TELEMETRY_NEW_USER === "true"
        },
        wts
    });
};

const getWcpOrgProjectId = () => {
    // In React applications, WCP project ID is stored in the `REACT_APP_WCP_PROJECT_ID` environment variable.
    const id = process.env.REACT_APP_WCP_PROJECT_ID;
    if (typeof id === "string") {
        return id.split("/");
    }
    return [];
};

module.exports = { sendEvent };
