const { red, green } = require("chalk");
const {
    loadEnvVariables,
    getPulumi,
    getProjectApplication,
    processHooks,
    login
} = require("../utils");

module.exports = async (inputs, context) => {
    const { env, folder } = inputs;

    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    await loadEnvVariables(inputs, context);

    const projectApplication = getProjectApplication(folder);
    const pulumi = await getPulumi({
        execa: {
            cwd: projectApplication.path.absolute
        }
    });

    await login(projectApplication);

    let stackExists = true;
    try {
        await pulumi.run({ command: ["stack", "select", env] });
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
        execa: {
            stdio: "inherit",
            env: {
                WEBINY_ENV: env,
                WEBINY_PROJECT_NAME: context.projectName
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
