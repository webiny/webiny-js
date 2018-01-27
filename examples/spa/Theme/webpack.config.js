const path = require("path");

module.exports = ({ config }) => {
    config.output.path = path.join(__dirname, "/../dist", process.env.NODE_ENV, "themes/default");

    return config;
};
