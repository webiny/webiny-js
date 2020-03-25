const { setTracking } = require("../../config");

module.exports = yargs => {
    yargs.command("enable-tracking", "Enable tracking of Webiny stats.", async () => {
        setTracking(true);
        console.log(
            "INFO: tracking of Webiny stats is now ENABLED! Thank you for helping us with anonymous data 🎉"
        );
    });

    yargs.command("disable-tracking", "Disable tracking of Webiny stats.", async () => {
        const { trackActivity } = require("@webiny/tracking");
        const uniqueId = require("uniqid");
        const { version } = require(require.resolve("@webiny/cli/package.json"));

        await trackActivity({
            type: "tracking-disabled",
            cliVersion: version,
            activityId: uniqueId()
        });
        setTracking(false);
        console.log("INFO: tracking of Webiny stats is now DISABLED!");
    });
};
