const merge = require("lodash.merge");

const getDefaults = () => ({
    region: null,
    bucket: null,
    functions: {
        downloadFile: {
            memory: 512,
            timeout: 10,
            env: {}
        },
        imageTransformer: {
            memory: 1600,
            timeout: 30,
            env: {}
        }
    }
});

module.exports = (inputs = {}) => {
    // This is considered as the "new" config.
    const output = getDefaults();
    if (inputs.functions) {
        merge(output, inputs);
    } else {
        // Otherwise, we take inputs, assign specific parameters and the rest to the apollo-service function.
        const { region, bucket } = inputs;

        output.region = region;
        output.bucket = bucket;
    }

    if (!output.region) {
        throw new Error(`Component "region" is missing.`);
    }

    if (!output.bucket) {
        throw new Error(`Component "bucket" is missing.`);
    }

    return output;
};
