const execa = require("execa");
const { PULUMI_BINARY_PATH } = require("@webiny/pulumi-sdk");
const { green, gray } = require("chalk");
const getPulumi = require("../utils/getPulumi");

module.exports = async inputs => {
    // Just in case, let's make sure Pulumi is installed.
    await getPulumi().install();

    const [, ...command] = inputs._;
    console.log(
        `Running command ${green(command.join(" "))} ${gray(`(via ${PULUMI_BINARY_PATH}`)}`
    );
    console.log();

    await execa(PULUMI_BINARY_PATH, command, {
        stdio: "inherit"
    });
};
