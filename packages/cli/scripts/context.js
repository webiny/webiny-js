const debug = require("debug")("webiny-scripts");

module.exports = {
    log(...args) {
        debug(...args);
    },
    error(...args) {
        debug(...args);
    }
};
