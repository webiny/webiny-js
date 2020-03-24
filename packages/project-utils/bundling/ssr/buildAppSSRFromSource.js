const path = require("path");
const fs = require("fs-extra");
const { bundle } = require("./bundle");
const { setupOutput } = require("./utils");

module.exports.buildAppSSRFromSource = async (
    { handler = null, renderer = null, output = null, ...options },
    context
) => {
    if (!renderer || !handler) {
        throw new Error(`Specify both "renderer" and "handler" to bundle.`);
    }

    renderer = path.resolve(renderer);
    output = setupOutput(output);

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = "production";
    }

    if (!process.env.REACT_APP_ENV) {
        process.env.REACT_APP_ENV = "ssr";
    }

    await bundle({ entry: renderer, output, ...options });
    await fs.copyFile(handler, path.resolve(output.path, "handler.js"));
};
