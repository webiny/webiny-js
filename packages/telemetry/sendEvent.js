const FormData = require("form-data");
const fetch = require("node-fetch");

const API_KEY = "ZdDZgkeOt4Z_m-UWmqFsE1d6-kcCK3BH0ypYTUIFty4";
const API_URL = "https://t.webiny.com";

/**
 * The main `sendEvent` function.
 * Note: it's recommended the one from `cli.js` and `react.js` files is used instead.
 * @param event
 * @param user
 * @param version
 * @param properties
 * @param extraPayload
 * @returns {Promise<T>}
 */
module.exports = async ({ event, user, version, properties, extraPayload } = {}) => {
    if (!event) {
        throw new Error(`Cannot send event - missing "event" name.`);
    }

    if (!user) {
        throw new Error(`Cannot send event - missing "user" property.`);
    }

    if (!version) {
        throw new Error(`Cannot send event - missing "version" property.`);
    }

    if (!properties) {
        properties = {};
    }

    if (!extraPayload) {
        extraPayload = {};
    }

    const payload = {
        ...extraPayload,
        event,
        properties: {
            ...properties,
            version
        },
        distinct_id: user,
        api_key: API_KEY,
        timestamp: new Date().toISOString()
    };

    const body = new FormData();
    body.append("data", Buffer.from(JSON.stringify(payload)).toString("base64"));

    return fetch(API_URL + "/capture/", {
        body,
        method: "POST"
    }).catch(() => {
        // Ignore errors
    });
};
