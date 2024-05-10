const getStackOutput = require("./getStackOutput");

const getDeploymentId = params => {
    if (!params.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const coreStackOutput = getStackOutput({
        folder: "core",
        environment: params.env
    });

    return coreStackOutput.deploymentId;
};

module.exports = getDeploymentId;
