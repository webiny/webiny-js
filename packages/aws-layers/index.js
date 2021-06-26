const { green, red } = require("chalk");

module.exports.getLayerArn = (name, region) => {
    if (!region) {
        // Try using AWS_REGION from environment variables as a fallback.
        region = process.env.AWS_REGION;
    }

    const layers = require("./layers");

    if (!layers[name]) {
        throw Error(
            `Layer ${red(name)} does not exist! Available layers are: ${Object.keys(layers)
                .map(k => `${green(k)}`)
                .join(", ")}`
        );
    }

    if (!layers[name][region]) {
        throw Error(`Layer ${red(name)} is not available in ${red(region)} region.`);
    }

    return layers[name][region];
};
