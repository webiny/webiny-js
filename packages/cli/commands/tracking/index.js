const { sendEvent } = require("@webiny/tracking");
const { setTracking } = require("../../config");

module.exports = {
    type: "cli-command",
    name: "cli-command-tracking",
    create({ yargs, context }) {
        yargs.command("enable-tracking", "Enable tracking of Webiny stats.", async () => {
            await setTracking(true);
            await sendEvent({ event: "enable-tracking" });
            context.info(
                `Tracking of Webiny stats is now ${context.info.hl(
                    "enabled"
                )}! Thank you for helping us in making Webiny better!`
            );
            context.info(
                `For more information, please visit the following link: https://www.webiny.com/telemetry.`
            );
        });

        yargs.command("disable-tracking", "Disable tracking of Webiny stats.", async () => {
            await setTracking(false);
            await sendEvent({ event: "disable-tracking" });
            context.info(`Tracking of Webiny stats is now ${context.info.hl("disabled")}!`);
            context.info(
                `Note that, in order to complete the process, you will also need to re-deploy your project, using the ${context.info.hl(
                    "yarn webiny deploy"
                )} command.`
            );
        });
    }
};
