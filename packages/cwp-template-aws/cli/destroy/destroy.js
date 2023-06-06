const fs = require("fs");
const { green } = require("chalk");
const { getPulumi } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const { getApiProjectApplicationFolder } = require("@webiny/cli/utils");
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
    await getPulumi({ install: false }).install();

    const apiFolder = getApiProjectApplicationFolder(context.project);
    const hasCore = fs.existsSync(path.join(context.project.root, "apps", "core"));

    console.log();
    context.info(`Destroying ${green("apps/website")} project application...`);
    await destroy("apps/website", env, inputs);
    context.success(`${green("apps/website")} project application was destroyed successfully.`);

    console.log();
    context.info(`Destroying ${green("apps/admin")} project application...`);
    await destroy("apps/admin", env, inputs);
    context.success(`${green("apps/admin")} project application was destroyed successfully.`);

    console.log();
    context.info(`Destroying ${green(apiFolder)} project application...`);
    await destroy(apiFolder, env, inputs);
    context.success(`${green(apiFolder)} project application was destroyed successfully.`);

    if (hasCore) {
        console.log();
        context.info(`Destroying ${green("core")} project application...`);
        await destroy("apps/core", env, inputs);
        context.success(`${green("core")} project application was destroyed successfully.`);
    }

    console.log(`Destroy complete (${green(env)} environment).`);
};
