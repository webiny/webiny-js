import { join } from "path";
import { buildFunction as build } from "@webiny/project-utils";

export const buildFunction = async (options, context) => {
    const userWebpack = options.webpack;

    options.webpack = config => {
        if (typeof userWebpack === "function") {
            config = userWebpack(config);
        }

        config.externals.push("sharp");
        config.plugins.push({
            apply: compiler => {
                compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
                    const extract = require("extract-zip");
                    extract(
                        join(__dirname, "node_modules.zip"),
                        { dir: join(process.cwd(), "build") },
                        e => {
                            if (e) {
                                throw e;
                            }
                        }
                    );
                });
            }
        });

        return config;
    };

    await build(options, context);
};
