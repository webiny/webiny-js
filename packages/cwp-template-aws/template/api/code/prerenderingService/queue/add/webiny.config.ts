import { buildFunction, watchFunction } from "@webiny/project-utils";

export default {
    commands: {
        build(options, context) {
            return buildFunction(
                {
                    ...options,
                    webpack(config) {
                        (config.externals as any).push("chrome-aws-lambda");
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
                        (config.externals as any).push("chrome-aws-lambda");
                        return config;
                    }
                },
                context
            );
        }
    }
};
