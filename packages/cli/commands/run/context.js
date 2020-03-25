module.exports = () => {
    const debug = require("debug")("webiny:run");

    return {
        log(...args) {
            debug(...args);
        },
        error(...args) {
            debug(...args);
        }
    };
};
