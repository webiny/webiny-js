const path = require("path");
const { red } = require("chalk");
const { getProjectApplication } = require("@webiny/cli/utils");
const { login, getPulumi, createProjectApplicationWorkspace } = require("../utils");

module.exports = async (inputs, context) => {
    const { env, folder, json } = inputs;

    const cwd = process.cwd();

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(cwd, inputs.folder)
    });

    // If needed, let's create a project application workspace.
    if (projectApplication.type === "v5-workspaces") {
        await createProjectApplicationWorkspace(projectApplication, { env });
    }

    // Will also install Pulumi, if not already installed.
    await login(projectApplication);

    const pulumi = await getPulumi({ projectApplication });

    let stackExists = true;
    try {
        const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
        const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

        await pulumi.run({
            command: ["stack", "select", env],
            args: {
                secretsProvider: PULUMI_SECRETS_PROVIDER
            },
            execa: {
                cwd: projectApplication.paths.workspace,
                env: {
                    PULUMI_CONFIG_PASSPHRASE
                }
            }
        });
    } catch (e) {
        stackExists = false;
    }

    if (stackExists) {
        return pulumi.run({
            command: ["stack", "output"],
            args: {
                json
            },
            execa: { cwd: projectApplication.paths.workspace, stdio: "inherit" }
        });
    }

    if (json) {
        return console.log(JSON.stringify(null));
    }

    context.error(
        `Project application ${red(folder)} (${red(stackName)} environment) does not exist.`
    );
};
