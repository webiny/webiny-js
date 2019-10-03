const os = require("os");
const path = require("path");
const uuid = require("uuid/v4");
const ua = require("universal-analytics");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");

const prefix = "[Webiny]";

let visitor, config;

module.exports = async context => {
    if (!config) {
        const dataPath = path.join(os.homedir(), ".webiny", "config");
        let userId, trackingDisabled;
        try {
            config = await readJson(dataPath);
            userId = config.id;
            if (!userId) {
                throw Error("Invalid Webiny config!");
            }
            trackingDisabled = Boolean(config.trackingDisabled);
            context.debug(`${prefix} Loaded existing config, user ID: ${userId}`);
        } catch (e) {
            userId = uuid();
            trackingDisabled = false;
            context.debug(`${prefix} Created new config, user ID: ${userId}`);
            await writeJson(dataPath, { id: userId });
            config = { id: userId, trackingDisabled };
        }

        context.debug(`${prefix} Tracking is ${trackingDisabled ? "DISABLED" : "ENABLED"}`);

        visitor = ua("UA-35527198-8", userId, { strictCidFormat: false });
        visitor.set("ds", "serverless");
    }

    if (config.trackingDisabled) {
        return () => {};
    }

    return ({ component, method }) => {
        context.debug(`${prefix} Tracking event: ${component} - ${method}`);
        return new Promise(resolve => {
            visitor
                .event(
                    {
                        ec: component,
                        ea: method,
                        instance: context.instance.id
                    },
                    resolve
                )
                .send();
        });
    };
};
