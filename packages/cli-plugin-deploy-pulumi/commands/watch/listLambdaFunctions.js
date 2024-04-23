const { getStackExport } = require("../../utils");
const path = require("path");

const listLambdaFunctions = ({ folder, env }) => {
    const stackExport = getStackExport({ folder, env });
    return stackExport.deployment.resources
        .filter(r => r.type === "aws:lambda/function:Function")
        .map(lambdaFunctionResource => {
            const fnName = lambdaFunctionResource.outputs.name;
            const handlerBuildFolderPath = lambdaFunctionResource.outputs.code.assets["."].path;
            const handlerPath = path.join(handlerBuildFolderPath, "handler.js");
            return { name: fnName, path: handlerPath };
        });
};

module.exports = { listLambdaFunctions };
