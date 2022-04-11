const { setWcpPat } = require("./utils");

module.exports.command = () => ({
    type: "cli-command",
    name: "cli-command-wcp-logout",
    create({ yargs }) {
        yargs.command(
            "logout",
            `Log out from the Webiny Control Panel`,
            yargs => {
                yargs.example("$0 logout");
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
            async () => {
                setWcpPat(null);
                console.log(`You've successfully logged out from Webiny Control Panel.`);
            }
        );
    }
});
