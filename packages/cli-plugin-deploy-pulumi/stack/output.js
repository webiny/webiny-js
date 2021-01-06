const { basename } = require("path");
const { red } = require("chalk");
const path = require("path");
const loadEnvFiles = require("../utils/loadEnvFiles");
const getPulumi = require("../utils/getPulumi");

const getStackName = folder => {
    folder = folder.split("/").pop();
    return folder === "." ? basename(process.cwd()) : folder;
};

module.exports = async (inputs, context) => {
    const { env, stack, json } = inputs;
    const stacksDir = path.join(".", stack);

    await loadEnvFiles(inputs, context);

    const pulumi = getPulumi({
        execa: {
            cwd: stacksDir
        }
    });

    const stackName = getStackName(stack);

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

    console.log(`ⅹ ${red(stackName)} does not exist!`);
};
