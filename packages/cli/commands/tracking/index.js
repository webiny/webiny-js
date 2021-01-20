const { setTracking } = require("../../config");

module.exports = {
    type: "cli-command",
    name: "cli-command-tracking",
    create({ yargs, context }) {
        yargs.command("enable-tracking", "Enable tracking of Webiny stats.", async () => {
            setTracking(true);
            context.info(
                "Tracking of Webiny stats is now ENABLED! Thank you for helping us with anonymous data."
            );
        });

        yargs.command("disable-tracking", "Disable tracking of Webiny stats.", async () => {
            const { sendEvent } = require("@webiny/tracking");

            await sendEvent({ event: "disable-tracking" });
            setTracking(false);
            context.info("Tracking of Webiny stats is now DISABLED!");
        });
    }
};
