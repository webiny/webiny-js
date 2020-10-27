const { version } = require("@webiny/project-utils/package.json");

module.exports.buildApp = options => {
    process.env.NODE_ENV = "production";
    process.env.REACT_APP_ENV = "browser";
    process.env.REACT_APP_WEBINY_VERSION = version;
    process.env.REACT_APP_USER_ID = require("@webiny/cli/config").getId();

    return require("./createProdConfig")(options);
};

module.exports.startApp = options => {
    process.env.NODE_ENV = "development";
    process.env.REACT_APP_ENV = "browser";
    process.env.REACT_APP_WEBINY_VERSION = version;
    process.env.REACT_APP_USER_ID = require("@webiny/cli/config").getId();

    return require("./createDevConfig")(options);
};
