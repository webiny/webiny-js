const { Pulumi } = require("@webiny/pulumi-sdk");
const path = require("path");

module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            require("@webiny/cwp-template-full/hooks/api")(),
            require("@webiny/cwp-template-full/hooks/apps")(),
            require("@webiny/cli-plugin-scaffold"),
            require("@webiny/cli-plugin-scaffold-graphql-service"),
            require("@webiny/cli-plugin-scaffold-lambda"),
            require("@webiny/cli-plugin-scaffold-admin-app-module"),
            require("@webiny/cli-plugin-scaffold-node-package"),
            require("@webiny/cli-plugin-scaffold-react-package"),
            require("@webiny/cli-plugin-scaffold-react-app"),
            require("@webiny/cli-plugin-build")(),
            require("@webiny/cli-plugin-deploy-pulumi")(),
            {
                type: "hook-after-deploy",
                name: "hook-after-deploy-pb-update-settings",
                async hook(args, context) {
                    if (args.stack !== "site") {
                        return;
                    }

                    // When the "site" stack is deployed, let's make sure we update Page Builder app's settings
                    // with necessary pieces of information. This way the user doesn't have to do this manually.
                    const pulumi = new Pulumi({
                        execa: {
                            cwd: path.join(context.paths.projectRoot, "apps", "site")
                        }
                    });

                    await pulumi.run({ command: ["stack", "select", args.env] });
                    const { stdout } = await pulumi.run({
                        command: ["stack", "output"],
                        args: {
                            stack: args.env,
                            json: true
                        }
                    });

                    const state = JSON.parse(stdout);
                    console.log("TODO: send this to PB app:");
                    console.log(JSON.stringify(state, null, 2));
                }
            }
        ]
    }
};
