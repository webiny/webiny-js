const path = require("path");
const { red } = require("chalk");
const { getProjectApplication } = require("@webiny/cli/utils");
const { getStackName } = require("@webiny/pulumi-sdk");
const { login, getPulumi, createProjectApplicationWorkspace } = require("../utils");

module.exports = async (inputs, context) => {
    const [, ...command] = inputs._;
    const { env, folder, debug, variant } = inputs;

    const stackName = getStackName({ env, variant });
    const cwd = process.cwd();

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(cwd, inputs.folder)
    });

    // If needed, let's create a project application workspace.
    if (projectApplication.type === "v5-workspaces") {
        await createProjectApplicationWorkspace(projectApplication, { env });
    }

    await login(projectApplication);

    const pulumi = await getPulumi({ projectApplication });

    if (env) {
        debug &&
            context.debug(
                `Environment provided - selecting ${context.debug.hl(stackName)} Pulumi stack.`
            );

        let stackExists = true;
        try {
            const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
            const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

            await pulumi.run({
                command: ["stack", "select", stackName],
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER
                },
                execa: {
                    env: {
                        PULUMI_CONFIG_PASSPHRASE
                    }
                }
            });
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(
                `Project application ${red(folder)} (${red(stackName)} environment) does not exist.`
            );
        }
    }

    if (debug) {
        const pulumiCommand = `${context.debug.hl("pulumi " + command.join(" "))}`;
        debug &&
            context.debug(
                `Running the following command in ${context.debug.hl(
                    folder
                )} folder: ${pulumiCommand}`
            );
    }

    return pulumi.run({
        command,
        execa: {
            stdio: "inherit",
            env: {
                WEBINY_ENV: env,
                WEBINY_VARIANT: variant,
                WEBINY_PROJECT_NAME: context.project.name
            }
        }
    });
};
