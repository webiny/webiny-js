const watchFunction = require("./watchFunction");

module.exports =
    config =>
    async (options = {}, context) => {
        return watchFunction({ options, config, context });
    };
