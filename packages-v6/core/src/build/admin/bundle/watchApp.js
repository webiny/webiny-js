const { applyDefaults } = require("./utils");

module.exports = options => {
    applyDefaults();

    if (!("REACT_APP_DEBUG" in process.env)) {
        process.env.REACT_APP_DEBUG = "true";
    }

    process.env.NODE_ENV = "development";

    return require("./createWatchConfig")(options);
};
