const telemetry = require("@webiny/telemetry/cli");

module.exports = {
    type: "cli-command",
    name: "cli-command-telemetry",
    create({ yargs, context }) {
        yargs.command("enable-telemetry", "Enable anonymous telemetry.", async () => {
            telemetry.enable();
            await telemetry.sendEvent({ event: "enable-telemetry" });
            context.info(
                `Webiny telemetry is now %s! Thank you for helping us in making Webiny better!`,
                "enabled"
            );
            context.info(
                `For more information, please visit the following link: https://www.webiny.com/telemetry.`
            );
        });

        yargs.command("disable-telemetry", "Disable anonymous telemetry.", async () => {
            await telemetry.sendEvent({ event: "disable-telemetry" });
            telemetry.disable();
            context.info(`Webiny telemetry is now %s!`, "disabled");
            context.info(
                `Note that, in order to complete the process, you will also need to re-deploy your project, using the %s command.`,
                "yarn webiny deploy"
            );
        });
    }
};
