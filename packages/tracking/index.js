const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const PostHog = require("posthog-node");

let client;
const getClient = () => {
    if (!client) {
        client = new PostHog("ZdDZgkeOt4Z_m-UWmqFsE1d6-kcCK3BH0ypYTUIFty4", {
            host: "http://posth-publi-14rhok399qeha-1644056996.us-east-1.elb.amazonaws.com"
        });
    }

    return client;
};

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
            config = { id: "unknown", tracking: true };
        }
    }
    return config;
};

module.exports.sendEvent = async ({ event, userId, data }) => {
    const config = await getConfig();
    const client = getClient();

    data = data || {};
    if (!data.version) {
        data.version = require("./package.json").version;
    }

    const payload = {
        distinctId: userId || config.id,
        event,
        properties: data
    };

    return new Promise(resolve => {
        client.capture(payload, resolve);
    });
};
