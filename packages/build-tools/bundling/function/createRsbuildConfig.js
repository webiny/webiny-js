import path from "path";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { createImportValidatorPlugin } from "../importValidatorPlugin.js";

export const createRsbuildConfig = async ({ cwd }) => {
    // Lazy import: @rspack/core uses import.meta.dirname at module top level, which
    // tsx's CJS transformer can't handle. Deferring keeps the module safe to require().
    const { default: rspack } = await import("@rspack/core");
    const paths = getPaths(cwd);
    const mode = getMode();

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.fn.entryFile }, tsconfigPath: paths.fn.tsConfig },
        output: {
            module: true,
            target: "node",
            sourceMap: {
                js: process.env.DEBUG === "true" ? "source-map" : false
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
                externals: [/^@aws-sdk/, /^aws-sdk$/, /^sharp$/],
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
