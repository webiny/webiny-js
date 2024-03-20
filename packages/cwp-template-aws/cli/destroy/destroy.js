const fs = require("fs");
const { green } = require("chalk");
const { getPulumi } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const path = require("path");
const execa = require("execa");

const destroy = (stack, env, inputs) =>
    execa(
        "yarn",
        [
            "webiny",
            "destroy",
            stack,
            "--env",
            env,
            "--debug",
            Boolean(inputs.debug),
            "--build",
            Boolean(inputs.build),
            "--preview",
            Boolean(inputs.preview)
        ],
        {
            stdio: "inherit"
        }
    );

module.exports = async (inputs, context) => {
    const { env } = inputs;

    // Ensure Pulumi is installed.
    const pulumi = await getPulumi({ install: false });

    pulumi.install();

    const hasCore = fs.existsSync(path.join(context.project.root, "apps", "core"));

    console.log();
    context.info(`Destroying ${green("Website")} project application...`);
    await destroy("apps/website", env, inputs);

    console.log();
    context.info(`Destroying ${green("Admin")} project application...`);
    await destroy("apps/admin", env, inputs);

    console.log();
    context.info(`Destroying ${green("API")} project application...`);
    await destroy("apps/api", env, inputs);

    if (hasCore) {
        console.log();
        context.info(`Destroying ${green("Core")} project application...`);
        await destroy("apps/core", env, inputs);
    }
};
