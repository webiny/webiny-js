const merge = require("lodash.merge");

const getDefaults = () => ({
    region: null,
    functions: {
        apolloService: {
            memory: 512,
            timeout: 10,
            database: null,
            uploadMinFileSize: 0,
            uploadMaxFileSize: 26214400,
            env: {},
            plugins: [],
            webpackConfig: null
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
        const { region, ...apolloServiceInputs } = inputs;

        output.region = region;
        output.functions.apolloService = {
            ...output.functions.apolloService,
            ...apolloServiceInputs
        };
    }

    if (!output.region) {
        throw new Error(`Component "region" is missing.`);
    }

    return output;
};
