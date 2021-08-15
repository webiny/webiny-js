const { red, green } = require("chalk");
const { loadEnvVariables, getPulumi, processHooks, login } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");
const path = require("path");

module.exports = async (inputs, context) => {
    const { env, folder } = inputs;

    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    await loadEnvVariables(inputs, context);

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(process.cwd(), inputs.folder)
    });

    const pulumi = await getPulumi({
        execa: {
            cwd: projectApplication.root
        }
    });

    await login(projectApplication);

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
                env: {
                    PULUMI_CONFIG_PASSPHRASE
                }
            }
        });
    } catch (e) {
        stackExists = false;
    }

    if (!stackExists) {
        context.error(
            `Project application ${red(folder)} (${red(env)} environment) does not exist.`
        );
        return;
    }

    const hooksParams = { context, env, projectApplication };

    await processHooks("hook-before-destroy", hooksParams);

    await pulumi.run({
        command: "destroy",
        args: {
            debug: inputs.debug
        },
        execa: {
            stdio: "inherit",
            env: {
                WEBINY_ENV: env,
                WEBINY_PROJECT_NAME: context.project.name
            }
        },
        args: {
            yes: true
        }
    });

    console.log();

    const duration = getDuration();
    context.success(`Done! Destroy finished in ${green(duration + "s")}.`);

    await processHooks("hook-after-destroy", hooksParams);
};
