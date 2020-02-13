const { setTracking } = require("./../config");
const { version } = require(require.resolve("@webiny/cli/package.json"));
const { trackActivity } = require("@webiny/tracking");

module.exports = async () => {
    setTracking(false);
    await trackActivity({ type: 'tracking-disabled', cliVersion: version });
    console.log("INFO: tracking of Webiny stats is now DISABLED!");
};
