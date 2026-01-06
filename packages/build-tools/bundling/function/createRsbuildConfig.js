import path from "path";
import rspack from "@rspack/core";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";

export const createRsbuildConfig = ({ cwd }) => {
    const paths = getPaths(cwd);
    const mode = getMode();

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.fn.entryFile } },
        output: {
            target: "node",
            filename: {
                js: pathData => {
                    if (pathData.chunk?.name === "index") {
                        return "handler.cjs";
                    }
                    return "[name].cjs";
                }
            },
            distPath: { root: paths.fn.outputFolderForDisplay }
        },
        tools: {
            rspack: {
                externals: [/^@aws-sdk/, /^sharp$/],
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

    const projectRootFolder = process.cwd();
    const relativePath = path.relative(projectRootFolder, fnOutputFolderPath);
    // Remove .webiny/workspace/apps/ prefix for display purposes
    const displayPath = relativePath.replace(/^\.webiny[/\\]workspace[/\\]apps[/\\]/, "");

    return {
        projectRootFolder,
        fn: {
            rootFolder: fnRootFolderPath,
            tsConfig: fnTsConfigFilePath,
            outputFolder: fnOutputFolderPath,
            outputFolderForDisplay: displayPath,
            entryFile: fnEntryFilePath
        }
    };
};

const getMode = () => {
    return process.env.NODE_ENV === "production" ? "production" : "development";
};
