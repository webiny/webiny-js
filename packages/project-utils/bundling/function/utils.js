const path = require("path");

const getDefaults = ({ cwd, projectApplication }) => {
    let outputPath = path.join(cwd, "build");
    if (projectApplication) {
        outputPath = path.join(
            projectApplication.paths.workspace,
            path.relative(projectApplication.paths.absolute, cwd),
            "build"
        );
    }

    return {
        outputPath,
        outputFilename: "handler.js"
    };
};

const getOutput = options => {
    let output = null;
    if (options.overrides && options.overrides.output) {
        output = options.overrides.output;
    }

    if (!output) {
        output = {};
    }

    const defaults = getDefaults(options);
    if (!output.path) {
        output.path = defaults.outputPath;
    }

    if (!output.filename) {
        output.filename = defaults.outputFilename;
    }

    output.path = path.resolve(output.path);

    return output;
};

const getEntry = ({ cwd, overrides }) => {
    return overrides.entry || path.join(cwd, "src/index");
};

module.exports = {
    getOutput,
    getEntry
};
