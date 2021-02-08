const uniqid = require("uniqid");

module.exports = (on, config) => {
    config.env.TEST_RUN_ID = uniqid();

    return config;
};
