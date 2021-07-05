const path = require("path");
const execa = require("execa");
const writeJson = require("write-json-file");
const { green, blue } = require("chalk");
const regions = require("./regions");

const LAYER_NAME = "webiny-v5-sharp";

(async () => {
    process.env.AWS_PROFILE = "webiny";
    console.log(`Using profile ${green(process.env.AWS_PROFILE)}`);
    const layersPath = path.join(__dirname, "layers.json");
    const layers = require(layersPath);
    try {
        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            try {
                console.log(`Deleting layer ${green(LAYER_NAME)} in ${green(region)}...`);
                // Delete layer
                await execa("aws", [
                    "lambda",
                    "delete-layer-version",
                    "--layer-name",
                    LAYER_NAME,
                    "--version-number",
                    layers[LAYER_NAME][region].split(":").pop(),
                    "--region",
                    region
                ]);

                layers[LAYER_NAME] = layers[LAYER_NAME] || {};
                delete layers[LAYER_NAME][region];

                console.log("");
            } catch (err) {
                console.log(`Error in region: ${region}`);
                console.log(err.message);
                console.log("");
            }
        }
    } finally {
        if (Object.keys(layers[LAYER_NAME])) {
            delete layers[LAYER_NAME];
        }
        console.log("Layers", JSON.stringify(layers, null, 2));
        await writeJson(layersPath, layers);
    }
})();
