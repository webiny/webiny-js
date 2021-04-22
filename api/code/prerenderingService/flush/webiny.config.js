const { buildFunction, watchFunction } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build(options, context) {
            return buildFunction(
                {
                    ...options,
                    webpack(config) {
                        config.externals.push("chrome-aws-lambda");
                        return config;
                    }
                },
                context
            );
        },
        watch(options, context) {
            return watchFunction(
                {
                    ...options,
                    webpack(config) {
                        config.externals.push("chrome-aws-lambda");
                        return config;
                    }
                },
                context
            );
        }
    }
};
