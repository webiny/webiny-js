import path from "path";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { createImportValidatorPlugin } from "../importValidatorPlugin.js";

const DEFAULT_WEBINY_INFRA_API_MAX_BUNDLE_SIZE = 4_718_592; // 4.5 MB

export const createRsbuildConfig = async ({ cwd, enforceMaxBundleSize }) => {
    // Must be a dynamic import — see rslibCompile.js for the reason.
    const { default: rspack } = await import("@rspack/core");
    const paths = getPaths(cwd);
    const mode = getMode();
    const isDebugEnabled = process.env.DEBUG === "true";

    // Configurable via WEBINY_INFRA_API_MAX_BUNDLE_SIZE (bytes).
    // Only enforced during build — watch mode skips size checks.
    const maxBundleSize =
        parseInt(process.env.WEBINY_INFRA_API_MAX_BUNDLE_SIZE) ||
        DEFAULT_WEBINY_INFRA_API_MAX_BUNDLE_SIZE;

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.fn.entryFile } },
        output: {
            module: true,
            target: "node",
            minify: true,
            sourceMap: {
                js: isDebugEnabled || mode === "development" ? "source-map" : false
            },
            filename: {
                js: pathData => {
                    if (pathData.chunk?.name === "index") {
                        return "handler.mjs";
                    }
                    return "[name].mjs";
                }
            },
            distPath: { root: paths.fn.outputFolder }
        },
        performance: {
            printFileSize: false
        },
        tools: {
            rspack: {
                ...(enforceMaxBundleSize && {
                    performance: {
                        hints: "error",
                        maxEntrypointSize: maxBundleSize,
                        maxAssetSize: maxBundleSize
                    }
                }),
                externals: [
                    /^@aws-sdk/,
                    /^aws-sdk$/,
                    /^sharp$/,
                    // knex is a runtime-polymorphic package: its source statically require()s a
                    // driver for EVERY SQL dialect (pg, mysql, mariadb, mssql, sqlite, ...) and
                    // picks one at runtime from the configured `client`. Bundling it forces the
                    // bundler to resolve drivers that aren't installed (the mariadb/tedious/pg
                    // "Module not found" errors). The server flavour runs as a Node process with
                    // node_modules present, so we externalize knex and let Node load it — knex then
                    // lazily require()s ONLY the configured dialect's driver (e.g. better-sqlite3),
                    // never the others.
                    /^knex(\/|$)/,
                    // These two server-flavour packages load a SIDECAR file at runtime via
                    // `import.meta.url`: background-tasks-server spawns dist/worker/workerEntry.js
                    // (worker_threads), and api-scheduler-server hands bree dist/jobs/pollWorker.js.
                    // Bundling them freezes import.meta.url to a build-machine source path and never
                    // emits those files into build/, so a shipped bundle can't find them. Like knex,
                    // the server flavour runs as a Node process with node_modules present — externalize
                    // them and let Node resolve them (and their sidecar files) from disk. Unused by the
                    // AWS flavour, so this is a no-op there. See webiny-js#5429.
                    /^@webiny\/background-tasks-server(\/|$)/,
                    /^@webiny\/api-scheduler-server(\/|$)/
                ],
                plugins: [
                    // This is necessary to enable JSDOM usage in Lambda.
                    // https://rspack.dev/plugins/webpack/ignore-plugin
                    new rspack.IgnorePlugin({
                        resourceRegExp: /canvas/,
                        contextRegExp: /jsdom$/
                    })
                ],
                resolve: {
                    fallback: {
                        // Disable optional native dependency used by 'ws' package for performance optimizations.
                        // Not needed in Lambda environment and can cause bundling/deployment issues.
                        bufferutil: false
                    }
                }
            }
        },
        mode,
        plugins: [
            createImportValidatorPlugin(),
            pluginTypeCheck({
                tsCheckerOptions: {
                    typescript: { configFile: paths.fn.tsConfig },
                    async: mode === "development"
                }
            })
        ]
    });
};

const getPaths = cwd => {
    const fnRootFolderPath = cwd;
    const fnOutputFolderPath = path.join(fnRootFolderPath, "build");
    const fnEntryFilePath = path.join(fnRootFolderPath, "src", "index.ts");

    const fnTsConfigFilePath = path.join(fnRootFolderPath, "tsconfig.json");

    return {
        projectRootFolder: process.cwd(),
        fn: {
            rootFolder: fnRootFolderPath,
            tsConfig: fnTsConfigFilePath,
            outputFolder: fnOutputFolderPath,
            entryFile: fnEntryFilePath
        }
    };
};

const getMode = () => {
    return process.env.NODE_ENV === "production" ? "production" : "development";
};
