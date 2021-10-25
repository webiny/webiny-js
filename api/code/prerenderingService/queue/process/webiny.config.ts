import { buildFunction, watchFunction } from "@webiny/project-utils";

export default {
    commands: {
        build: (options, context) =>
            buildFunction(
                {
                    ...options,
                    webpack(config) {
                        // @ts-ignore
                        config.externals.push("chrome-aws-lambda");
                        return config;
                    },
                    output: {
                        path: __dirname + "/build",
                        filename: "handler.js"
                    },
                    entry: __dirname + "/src/index.ts"
                },
                context
            ),
        watch(options, context) {
            return watchFunction(
                {
                    ...options,
                    webpack(config) {
                        // @ts-ignore
                        config.externals.push("chrome-aws-lambda");
                        return config;
                    }
                },
                context
            );
        }
    }
};
