const { version } = require("@webiny/project-utils/package.json");

const applyDefaults = () => {
    if (!("INLINE_RUNTIME_CHUNK" in process.env)) {
        process.env.INLINE_RUNTIME_CHUNK = "true";
    }
};

module.exports.buildApp = options => {
    applyDefaults();
    process.env.NODE_ENV = "production";
    if (!process.env.REACT_APP_WEBINY_VERSION) {
        process.env.REACT_APP_WEBINY_VERSION = version;
    }
    process.env.REACT_APP_USER_ID = require("@webiny/cli/config").getId();

    return require("./createProdConfig")(options);
};

module.exports.startApp = options => {
    applyDefaults();
    if (!("REACT_APP_DEBUG" in process.env)) {
        process.env.REACT_APP_DEBUG = "true";
    }
    process.env.NODE_ENV = "development";
    if (!process.env.REACT_APP_WEBINY_VERSION) {
        process.env.REACT_APP_WEBINY_VERSION = version;
    }
    process.env.REACT_APP_USER_ID = require("@webiny/cli/config").getId();

    return require("./createDevConfig")(options);
};
