import { buildFunction, watchFunction } from "@webiny/project-utils";

const webpack = config => {
    (config.externals as any).push("chrome-aws-lambda");
    return config;
};

export default {
    commands: {
        build(options, context) {
            return buildFunction({ ...options, webpack }, context);
        },
        watch(options, context) {
            return watchFunction({ ...options, webpack }, context);
        }
    }
};
