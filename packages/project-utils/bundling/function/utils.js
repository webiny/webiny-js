const path = require("path");
const { getProject } = require("@webiny/cli/utils");

const getDefaults = cwd => ({
    outputPath: path.join(cwd, "build"),
    outputFilename: "handler.js"
});

const getOutput = ({ cwd, overrides }) => {
    let output = null;
    if (overrides && overrides.output) {
        output = overrides.output;
    }

    if (!output) {
        output = {};
    }

    const defaults = getDefaults(cwd);
    if (!output.path) {
        output.path = defaults.outputPath;
    }

    if (!output.filename) {
        output.filename = defaults.outputFilename;
    }

    output.path = path.resolve(output.path);

    return output;
};

const getTelemetryFunctionDownloadPath = () => {
    return path.join(getProject().root, ".webiny", "telemetryFunction.js");
};

const getEntry = ({ cwd, overrides }) => {
    return overrides.entry || path.join(cwd, "src/index");
};

module.exports = {
    getOutput,
    getTelemetryFunctionDownloadPath,
    getEntry
};
