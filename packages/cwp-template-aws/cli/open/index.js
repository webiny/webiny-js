const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const open = require("open");

module.exports = {
    type: "cli-command",
    name: "cli-command-open",
    create({ yargs }) {
        yargs.command(
            "open <folder>",
            `Quickly open Admin or Website application in your default browser`,
            yargs => {
                yargs.option("env", {
                    describe: `Environment`,
                    type: "string",
                    required: true
                });
            },
            async args => {
                let appOutput;
                if (args.folder === "website") {
                    appOutput = getStackOutput({
                        folder: "website",
                        env: args.env
                    });
                } else {
                    appOutput = getStackOutput({ folder: "admin", env: args.env });
                }


                const { appUrl } = appOutput;
                console.log(`Opening ${appUrl}...`);

                return new Promise(resolve => {
                    setTimeout(() => {
                        open(appUrl);
                        resolve();
                    }, 1000);
                });
            }
        );
    }
};
