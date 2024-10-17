const path = require("path");
const execa = require("execa");
const writeJson = require("write-json-file");
const { green, blue } = require("chalk");
const regions = require("./regions");

const BUCKET_NAME = "webiny-layers";
const LAYER_NAME = "chromium";
const LAYER_ZIP = "chromium-v123.0.1-layer.zip";
const LAYER_ZIP_KEY = `${LAYER_NAME}/${LAYER_ZIP}`;

async function createBucketIfNotExists(region) {
    const bucketName = `${BUCKET_NAME}-${region}`;

    const locationConstraint = [];
    if (region !== "us-east-1") {
        locationConstraint.push("--create-bucket-configuration");
        locationConstraint.push(`LocationConstraint=${region}`);
    }

    try {
        await execa("aws", [
            "s3api",
            "create-bucket",
            "--bucket",
            bucketName,
            "--region",
            region,
            ...locationConstraint
        ]);
    } catch (err) {
        if (err && !err.stderr.includes("BucketAlreadyOwnedByYou")) {
            throw Error(err);
        }
    }

    return bucketName;
}

(async () => {
    process.env.AWS_PROFILE = "webiny";
    console.log(`Using profile ${green(process.env.AWS_PROFILE)}`);
    const layersPath = path.join(__dirname, "layers.json");
    const layers = require(layersPath);
    try {
        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];

            const bucketName = await createBucketIfNotExists(region);

            // Upload ZIP file to S3 bucket
            console.log(`Uploading layer archive ${green(LAYER_ZIP)} to ${green(bucketName)}...`);
            await execa("aws", [
                "s3",
                "cp",
                path.join(__dirname, LAYER_ZIP),
                `s3://${bucketName}/${LAYER_ZIP_KEY}`,
                // For opt-in regions, we _must_ explicitly specify the region, so let's just always specify it.
                // https://github.com/aws/aws-cli/issues/8289#issuecomment-1791580189
                "--region",
                region
            ]);

            try {
                console.log(`Creating layer ${green(LAYER_NAME)} in ${green(region)}...`);
                // Create layer
                const { stdout } = await execa("aws", [
                    "lambda",
                    "publish-layer-version",
                    "--layer-name",
                    LAYER_NAME,
                    "--description",
                    "Chromium ",
                    "--content",
                    `S3Bucket=${bucketName},S3Key=${LAYER_ZIP_KEY}`,
                    "--compatible-runtimes",
                    "nodejs20.x",
                    "--region",
                    region,
                    "--cli-read-timeout",
                    "0",
                    "--cli-connect-timeout",
                    "0",
                    "--output",
                    "json"
                ]);

                const layer = JSON.parse(stdout);

                console.log(`Created`, blue(layer.LayerVersionArn));

                await execa("aws", [
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
                    layer.Version,
                    "--region",
                    region
                ]);

                layers[LAYER_NAME] = layers[LAYER_NAME] || {};
                layers[LAYER_NAME][region] = layer.LayerVersionArn;

                console.log("");
            } catch (err) {
                console.log(`Error in region: ${region}`);
                console.log(err.message);
                console.log("");
            }
        }
    } finally {
        console.log("Layers", JSON.stringify(layers, null, 2));
        await writeJson(layersPath, layers);
    }
})();
