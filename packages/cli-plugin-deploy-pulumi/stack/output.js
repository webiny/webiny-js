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
    const { env, stack } = inputs;
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

    if (!stackExists) {
        console.log(`⚠️ ${red(stackName)} does not exist!`);
        return;
    }

    await pulumi.run({
        command: ["stack", "output"],
        execa: { stdio: "inherit" }
    });
};
