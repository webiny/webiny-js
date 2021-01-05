/* eslint-disable */
const { API_KEY, API_URL } = require("./api");

const setProperties = data => {
    sendEvent("$identify", {}, data);
};

const sendEvent = (event, data = {}) => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY !== "false") {
        data.version = process.env.REACT_APP_WEBINY_VERSION;

        const payload = {
            api_key: API_KEY,
            distinct_id: process.env.REACT_APP_USER_ID,
            event,
            properties: event === "$identify" ? {} : data,
            $set: event === "$identify" ? data : {},
            timestamp: new Date().toISOString()
        };

        const formData = new FormData();
        formData.append("data", btoa(JSON.stringify(payload)));

        return fetch(API_URL + "/capture/", {
            method: "POST",
            body: formData
        }).catch(() => {
            // Ignore errors
        });
    }
};

module.exports = { setProperties, sendEvent };
