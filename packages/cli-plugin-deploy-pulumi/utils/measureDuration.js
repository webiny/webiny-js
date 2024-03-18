const humanizeDuration = require("humanize-duration");

module.exports = () => {
    const start = new Date();
    return () => humanizeDuration(new Date() - start, {
        maxDecimalPoints: 2
    });
};
