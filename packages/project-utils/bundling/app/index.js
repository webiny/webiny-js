const { version } = require("@webiny/project-utils/package.json");

const applyDefaults = () => {
    if (!("SKIP_PREFLIGHT_CHECK" in process.env)) {
        process.env.SKIP_PREFLIGHT_CHECK = true;
    }

    if (!("INLINE_RUNTIME_CHUNK" in process.env)) {
        process.env.INLINE_RUNTIME_CHUNK = true;
    }
};

module.exports.buildApp = options => {
    applyDefaults();
    process.env.NODE_ENV = "production";
    process.env.REACT_APP_WEBINY_VERSION = version;
    process.env.REACT_APP_USER_ID = require("@webiny/cli/config").getId();

    return require("./createProdConfig")(options);
};

module.exports.startApp = options => {
    applyDefaults();
    process.env.NODE_ENV = "development";
    process.env.REACT_APP_WEBINY_VERSION = version;
    process.env.REACT_APP_USER_ID = require("@webiny/cli/config").getId();

    return require("./createDevConfig")(options);
};
