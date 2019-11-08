const merge = require("lodash.merge");

const getDefaults = () => ({
    region: null,
    bucket: null,
    functions: {
        apolloService: {
            memory: 512,
            timeout: 10,
            database: null,
            uploadMinFileSize: 0,
            uploadMaxFileSize: 26214400,
            env: {},
            webpackConfig: null
        },
        downloadFile: {
            memory: 512,
            timeout: 10,
            env: {}
        },
        imageTransformer: {
            memory: 1024,
            timeout: 10,
            env: {}
        }
    },
});

module.exports = (inputs = {}) => {
    // This is considered as the "new" config.
    let output = getDefaults();
    if (inputs.functions) {
        merge(output, inputs);
    } else {
        // Otherwise, we take inputs, assign specific parameters and the rest to the apollo-service function.
        const { region, bucket, ...apolloServiceInputs } = inputs;

        output.region = region;
        output.bucket = bucket;
        output.functions.apolloService = {
            ...output.functions.apolloService,
            ...apolloServiceInputs
        };
    }

    if (!output.region) {
        throw new Error(`Component "region" is missing.`);
    }

    if (!output.bucket) {
        throw new Error(`Component "bucket" is missing.`);
    }

    return output;
};
