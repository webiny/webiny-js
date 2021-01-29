const execa = require("execa");
const { PULUMI_BINARY_PATH } = require("@webiny/pulumi-sdk");
const { green, gray } = require("chalk");
const getPulumi = require("../utils/getPulumi");

module.exports = async (inputs, context) => {
    // Just in case, let's make sure Pulumi is installed.
    await getPulumi().install();

    const [, command] = inputs._;
    context.info(`Running command ${green(command)} ${gray(`(via ${PULUMI_BINARY_PATH}`)}`);
    console.log();

    await execa(PULUMI_BINARY_PATH, command.split(" "), {
        stdio: "inherit"
    });
};
