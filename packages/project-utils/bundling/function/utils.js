const path = require("path");
const fs = require("fs-extra");
const telemetry = require("./telemetry");

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

const getEntry = ({ cwd, overrides }) => {
    return overrides.entry || path.join(cwd, "src/index");
};

async function injectHandlerTelemetry(cwd) {
    await telemetry.updateTelemetryFunction();

    fs.copyFileSync(path.join(cwd, "build", "handler.js"), path.join(cwd, "build", "_handler.js"));

    // Create a new handler.js.
    const telemetryFunction = await fs.readFile(path.join(__dirname, "/telemetryFunction.js"), {
        encoding: "utf8",
        flag: "r"
    });

    fs.writeFileSync(path.join(cwd, "build", "handler.js"), telemetryFunction);
}

module.exports = { getOutput, getEntry, injectHandlerTelemetry };
