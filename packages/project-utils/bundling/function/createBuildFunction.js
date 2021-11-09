const buildFunction = require("./buildFunction");

module.exports =
    config =>
        async (options = {}, context) => {
            return buildFunction({ options, config, context });
        };
