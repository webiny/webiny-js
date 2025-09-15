import path from "path";
import fs from "fs-extra";
import { rspack } from "@rspack/core";
import { BaseAppBundler } from "./BaseAppBundler.js";
import { createRspackConfig } from "./rspack/createRspackConfig.js";
import { TailwindSuppressor } from "./rspack/TailwindSuppressor.js";
import { formatWebpackMessages } from "./rspack/formatWebpackMessages.js";
import createPaths from "./rspack/config/paths.js";

export class RspackBundler extends BaseAppBundler {
    constructor(params) {
        super();
        this.params = params;
        this.tailwindSuppressor = new TailwindSuppressor();

        const { cwd, overrides } = params;
        const appIndexJs = overrides.entry || path.resolve(cwd, "src", "index.tsx");
        this.paths = createPaths({ appIndexJs, cwd });
    }

    build() {
        this.tailwindSuppressor.enable();

        process.env.NODE_ENV = "production";

        return new Promise(async (resolve, reject) => {
            const rspackConfig = await this.getRspackConfig("production");
            const compiler = rspack(rspackConfig);

            this.emptyBuildDir();

            compiler.run((err, stats) => {
                this.tailwindSuppressor.disable();

                let messages = {};

                if (err) {
                    messages = formatWebpackMessages({
                        errors: [err.message],
                        warnings: []
                    });

                    const errorMessages = messages.errors.join("\n\n");
                    console.error(errorMessages);
                    return reject(new Error(errorMessages));
                }

                if (stats.hasErrors()) {
                    messages = formatWebpackMessages(
                        stats.toJson({
                            all: false,
                            warnings: true,
                            errors: true
                        })
                    );

                }

                if (Array.isArray(messages.errors) && messages.errors.length) {
                    // if (messages.errors.length > 1) {
                    //     messages.errors.length = 1;
                    // }
                    const errorMessages = messages.errors.join("\n\n");
                    console.error(errorMessages);
                    return reject(new Error(errorMessages));
                }

                console.log("Compiled successfully.");
                resolve();
            });
        });
    }

    async watch() {
        this.tailwindSuppressor.enable();

        if (!("REACT_APP_DEBUG" in process.env)) {
            process.env.REACT_APP_DEBUG = "true";
        }

        process.env.NODE_ENV = "development";
        process.env.ESLINT_NO_UNUSED_VARS = "0";

        const rspackConfig = await this.getRspackConfig("development");
        const compiler = rspack(rspackConfig);
        
        //eslint-disable-next-line import/dynamic-import-chunkname
        const { RspackDevServer } = await import("./rspack/RspackDevServer.js");
        const devServer = new RspackDevServer(compiler, { paths: this.paths });

        this.emptyBuildDir();
        await devServer.start();
    }

    emptyBuildDir() {
        fs.emptyDirSync(this.paths.appBuild);
    }

    async getRspackConfig(env) {
        return await createRspackConfig(this.paths, {
            ...this.params,
            env
        });
    }
}
