const { basename } = require("path");
const { red } = require("chalk");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");

const getStackName = folder => {
    folder = folder.split("/").pop();
    return folder === "." ? basename(process.cwd()) : folder;
};

module.exports = async (inputs, context) => {
    const { env, folder, json } = inputs;
    const stacksDir = path.join(".", folder).replace(/\\/g, "/");

    await loadEnvVariables(inputs, context);

    await login(folder)

    const pulumi = getPulumi({
        execa: {
            cwd: stacksDir
        }
    });

    const stackName = getStackName(folder);

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

    context.error(`${red(stackName)} does not exist!`);
};
