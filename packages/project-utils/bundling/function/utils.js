const path = require("path");

const defaults = {
    outputPath: "build",
    outputFilename: "handler.js"
};

const setupOutput = output => {
    if (!output) {
        output = {};
    }

    if (!output.path) {
        output.path = defaults.outputPath;
    }

    if (!output.filename) {
        output.filename = defaults.outputFilename;
    }

    output.path = path.resolve(output.path);

    return output;
};

module.exports = { setupOutput };
