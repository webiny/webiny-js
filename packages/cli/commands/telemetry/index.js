const { sendEvent } = require("@webiny/telemetry");
const { setTelemetry } = require("../../config");

module.exports = {
    type: "cli-command",
    name: "cli-command-telemetry",
    create({ yargs, context }) {
        yargs.command("enable-telemetry", "Enable anonymous telemetry.", async () => {
            await setTelemetry(true);
            await sendEvent({ event: "enable-telemetry" });
            context.info(
                `Webiny telemetry is now ${context.info.hl(
                    "enabled"
                )}! Thank you for helping us in making Webiny better!`
            );
            context.info(
                `For more information, please visit the following link: https://www.webiny.com/telemetry.`
            );
        });

        yargs.command("disable-telemetry", "Disable anonymous telemetry.", async () => {
            await sendEvent({ event: "disable-telemetry" });
            await setTelemetry(false);
            context.info(`Webiny telemetry is now ${context.info.hl("disabled")}!`);
            context.info(
                `Note that, in order to complete the process, you will also need to re-deploy your project, using the ${context.info.hl(
                    "yarn webiny deploy"
                )} command.`
            );
        });
    }
};
