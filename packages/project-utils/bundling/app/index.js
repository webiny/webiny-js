const { version } = require("@webiny/project-utils/package.json");
const { getProject } = require("@webiny/cli/utils");
const { isEnabled } = require("@webiny/telemetry/cli");
const { globalConfig } = require("@webiny/global-config");

const applyDefaults = () => {
    let telemetry;
    const config = getProject().config;
    if (config.cli && config.cli.telemetry === false) {
        telemetry = false;
    } else {
        telemetry = isEnabled();
    }

    if (!("REACT_APP_USER_ID" in process.env)) {
        process.env.REACT_APP_USER_ID = globalConfig.get("id");
    }

    if (!("REACT_APP_WEBINY_TELEMETRY" in process.env)) {
        process.env.REACT_APP_WEBINY_TELEMETRY = String(telemetry);
    }

    if (!("INLINE_RUNTIME_CHUNK" in process.env)) {
        process.env.INLINE_RUNTIME_CHUNK = "true";
    }

    if (!("REACT_APP_WEBINY_VERSION" in process.env)) {
        process.env.REACT_APP_WEBINY_VERSION = version;
    }

    if ("WEBINY_MULTI_TENANCY" in process.env) {
        process.env.REACT_APP_WEBINY_MULTI_TENANCY = process.env.WEBINY_MULTI_TENANCY;
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
