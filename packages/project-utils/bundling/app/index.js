const { version } = require("@webiny/project-utils/package.json");

const applyDefaults = () => {
    const config = require("@webiny/cli/config").getConfig();
    if (!("REACT_APP_USER_ID" in process.env)) {
        process.env.REACT_APP_USER_ID = config.id;
    }

    if (!("REACT_APP_WEBINY_TELEMETRY" in process.env)) {
        process.env.REACT_APP_WEBINY_TELEMETRY = "telemetry" in config ? config.telemetry : "true";
    }

    if (!("INLINE_RUNTIME_CHUNK" in process.env)) {
        process.env.INLINE_RUNTIME_CHUNK = "true";
    }

    if (!("REACT_APP_WEBINY_VERSION" in process.env)) {
        process.env.REACT_APP_WEBINY_VERSION = version;
    }
};

module.exports.buildApp = options => {
    applyDefaults();

    process.env.NODE_ENV = "production";

    return require("./createProdConfig")(options);
};

module.exports.startApp = options => {
    applyDefaults();

    if (!("REACT_APP_DEBUG" in process.env)) {
        process.env.REACT_APP_DEBUG = "true";
    }

    process.env.NODE_ENV = "development";

    return require("./createDevConfig")(options);
};
