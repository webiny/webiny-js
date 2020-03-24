process.env.DEBUG = process.env.DEBUG + ",webiny";
const debug = require("debug")("webiny");

module.exports = {
    log(...args) {
        debug(...args);
    },
    error(...args) {
        debug(...args);
    }
};
