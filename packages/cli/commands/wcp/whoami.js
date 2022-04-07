const { getUser } = require("./utils");

module.exports.command = () => ({
    type: "cli-command",
    name: "cli-command-wcp-whoami",
    create({ yargs, context }) {
        yargs.command(
            "whoami",
            `Display the current logged-in user`,
            yargs => {
                yargs.example("$0 whoami");
                yargs.option("debug", {
                    describe: `Turn on debug logs`,
                    type: "boolean"
                });
                yargs.option("debug-level", {
                    default: 1,
                    describe: `Set the debug logs verbosity level`,
                    type: "number"
                });
            },
            async ({ debug }) => {
                try {
                    const user = await getUser();
                    console.log(
                        `You are logged in to Webiny Control Panel as ${context.info.hl(
                            user.email
                        )}.`
                    );
                } catch (e) {
                    if (debug) {
                        context.debug(e);
                    }
                    throw new Error(
                        `It seems you are not logged in. Please login using the ${context.error.hl(
                            "webiny login"
                        )} command.`
                    );
                }
            }
        );
    }
});
