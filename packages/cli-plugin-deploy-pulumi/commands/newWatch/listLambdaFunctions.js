const { getStackExport } = require("../../utils");
const path = require("path");
const minimatch = require("minimatch");

const listLambdaFunctions = ({ folder, env, function: fn }) => {
    const stackExport = getStackExport({ folder, env });
    if (!stackExport) {
        // If no stack export is found, return an empty array. This is a valid scenario.
        // For example, watching the Admin app locally, but not deploying it.
        return [];
    }

    const functionsList = stackExport.deployment.resources
        .filter(r => r.type === "aws:lambda/function:Function")
        // This filter ensures that Lambda@Edge functions are excluded.
        .filter(lambdaFunctionResource => "." in lambdaFunctionResource.outputs.code.assets)
        .map(lambdaFunctionResource => {
            const fnName = lambdaFunctionResource.outputs.name;
            const handlerBuildFolderPath = lambdaFunctionResource.outputs.code.assets["."].path;
            const handlerPath = path.join(handlerBuildFolderPath, "handler.js");
            return { name: fnName, path: handlerPath };
        });

    if (!fn) {
        return functionsList;
    }

    const functionNamesToMatch = Array.isArray(fn) ? fn : [fn];

    // `functionNamesToWatch` is an array of glob patterns, which denote which functions to watch.
    return functionsList.filter(fn => {
        return functionNamesToMatch.some(pattern => {
            if (pattern.includes("*")) {
                return minimatch(fn.name, pattern);
            }

            return fn.name.includes(pattern);
        });
    });
};

module.exports = { listLambdaFunctions };
