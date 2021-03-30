const { red } = require("chalk");
const { login, getPulumi, loadEnvVariables, getProjectApplication } = require("../utils");

module.exports = async (inputs, context) => {
    const { env, folder, json } = inputs;
    const projectApplication = getProjectApplication(folder)
    await loadEnvVariables(inputs, context);

    // Will also install Pulumi, if not already installed.
    await login(projectApplication);

    const pulumi = await getPulumi({
        execa: {
            cwd: projectApplication.path.absolute
        }
    });

    let stackExists = true;
    try {
        await pulumi.run({ command: ["stack", "select", env] });
    } catch (e) {
        stackExists = false;
    }

    if (stackExists) {
        return pulumi.run({
            command: ["stack", "output"],
            args: {
                json
            },
            execa: { stdio: "inherit" }
        });
    }

    if (json) {
        return console.log(JSON.stringify(null));
    }

    context.error(`Project application ${red(folder)} (${red(env)} environment) does not exist.`);
};
