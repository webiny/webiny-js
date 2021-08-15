const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const FormData = require("form-data");
const fetch = require("node-fetch");
const { API_KEY, API_URL } = require("./api");

let config;
const getConfig = async () => {
    if (!config) {
        const dataPath = path.join(os.homedir(), ".webiny", "config");
        try {
            config = readJson.sync(dataPath);
            if (!config.id) {
                config.id = "unknown";
            }
        } catch (e) {
            config = { id: "unknown" };
        }
    }
    return config;
};

module.exports.sendEvent = async ({ event, data }) => {
    const config = await getConfig();

    // Check both `telemetry` and `tracking` for backwards compatibility
    if (config.telemetry === false || config.tracking === false) {
        return;
    }

    data = data || {};
    if (!data.version) {
        data.version = require("./package.json").version;
    }

    const payload = {
        api_key: API_KEY,
        distinct_id: config.id,
        event,
        properties: data,
        timestamp: new Date().toISOString()
    };

    const formData = new FormData();
    formData.append("data", Buffer.from(JSON.stringify(payload)).toString("base64"));

    return fetch(API_URL + "/capture/", {
        method: "POST",
        body: formData
    }).catch(() => {
        // Ignore errors
    });
};
