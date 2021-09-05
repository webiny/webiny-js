const { sendEvent } = require("@webiny/cli/utils/sendEvent");
const telemetry = require("@webiny/telemetry");

module.exports = {
    type: "cli-command",
    name: "cli-command-telemetry",
    create({ yargs, context }) {
        yargs.command("enable-telemetry", "Enable anonymous telemetry.", async () => {
            telemetry.enable();
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
            telemetry.disable();
            await sendEvent({ event: "disable-telemetry" });
            context.info(`Webiny telemetry is now ${context.info.hl("disabled")}!`);
            context.info(
                `Note that, in order to complete the process, you will also need to re-deploy your project, using the ${context.info.hl(
                    "yarn webiny deploy"
                )} command.`
            );
        });
    }
};
