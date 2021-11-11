const watchPackage = require("./watchPackage");

module.exports =
    config =>
    async (options = {}, context) => {
        const start = new Date();
        const getDuration = () => {
            return (new Date() - start) / 1000;
        };

        await watchPackage({ options, config, context });

        log.info(`Done! Build finished in ${log.info.hl(getDuration() + "s")}.`);
    };
