const buildPackage = require("./buildPackage");

module.exports =
    config =>
    async (options = {}, context) => {
        await buildPackage({ options, config, context });
    };
