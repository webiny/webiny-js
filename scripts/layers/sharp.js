import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import regions from "./regions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LAYER_NAME = "sharp";

process.env.AWS_PROFILE = "webiny";
console.log(`Using profile: ${process.env.AWS_PROFILE}`);

const layersPath = join(__dirname, "layers.json");
const layers = existsSync(layersPath) ? JSON.parse(readFileSync(layersPath, "utf8")) : {};

try {
    for (const region of regions) {
        try {
            console.log(`Publishing ${LAYER_NAME} in ${region}...`);

            const stdout = execFileSync(
                "aws",
                [
                    "lambda",
                    "publish-layer-version",
                    "--layer-name",
                    LAYER_NAME,
                    "--description",
                    "Sharp dependency for image transformation",
                    "--zip-file",
                    "fileb://" + join(__dirname, "sharp-x64.zip"),
                    "--compatible-runtimes",
                    "nodejs22.x",
                    "nodejs24.x",
                    "--region",
                    region,
                    "--cli-read-timeout",
                    "0",
                    "--cli-connect-timeout",
                    "0",
                    "--output",
                    "json"
                ],
                { encoding: "utf8", timeout: 120_000 }
            );

            const layer = JSON.parse(stdout);
            console.log(`  → ${layer.LayerVersionArn}`);

            execFileSync(
                "aws",
                [
                    "lambda",
                    "add-layer-version-permission",
                    "--layer-name",
                    LAYER_NAME,
                    "--statement-id",
                    "public",
                    "--action",
                    "lambda:GetLayerVersion",
                    "--principal",
                    "*",
                    "--version-number",
                    String(layer.Version),
                    "--region",
                    region
                ],
                { encoding: "utf8", timeout: 30_000 }
            );

            layers[LAYER_NAME] = layers[LAYER_NAME] || {};
            layers[LAYER_NAME][region] = layer.LayerVersionArn;

            console.log(`  Done.\n`);
        } catch (err) {
            console.error(`Error in region ${region}: ${err.message}\n`);
        }
    }
} finally {
    console.log("Layers:", JSON.stringify(layers, null, 2));
    writeFileSync(layersPath, JSON.stringify(layers, null, 2));
    console.log(`Written to ${layersPath}`);
}
