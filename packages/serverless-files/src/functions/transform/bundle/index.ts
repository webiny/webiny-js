import { buildFunction as build } from "@webiny/project-utils";

export const buildFunction = async (options, context) => {
    const userWebpack = options.webpack;

    options.webpack = config => {
        if (typeof userWebpack === "function") {
            config = userWebpack(config);
        }

        config.externals.push("sharp");

        return config;
    };

    await build(options, context);
};
