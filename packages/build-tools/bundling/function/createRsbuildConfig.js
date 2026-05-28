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
                js: isDebugEnabled ? "source-map" : false
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
