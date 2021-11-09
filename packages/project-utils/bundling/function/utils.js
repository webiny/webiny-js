const path = require("path");

const getDefaults = cwd => ({
    outputPath: path.join(cwd, "build"),
    outputFilename: "handler.js"
});

const getOutput = params => {
    let output = null;
    if (params.config.overrides && params.config.overrides.output) {
        output = params.config.overrides.output;
    }

    if (!output) {
        output = {};
    }

    const defaults = getDefaults(params.config.cwd);
    if (!output.path) {
        output.path = defaults.outputPath;
    }

    if (!output.filename) {
        output.filename = defaults.outputFilename;
    }

    output.path = path.resolve(output.path);

    return output;
};

const getEntry = params => {
    const overrides = params.config.overrides || {};
    return overrides.entry || path.join(params.config.cwd, "src/index");
};

module.exports = { getOutput, getEntry };
