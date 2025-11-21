import path from "path";
import rspack from "@rspack/core";

export const createRsbuildConfig = ({ cwd }) => {
    const paths = getPaths(cwd);
    const mode = getMode();

    return {
        source: { entry: { index: paths.fn.entryFile } },
        output: {
            target: "node",
            filename: {
                js: pathData => {
                    if (pathData.chunk?.name === "index") {
                        return "handler.js";
                    }
                    return "[name].js";
                }
            },
            distPath: { root: paths.fn.outputFolder }
        },
        tools: {
            rspack: {
                plugins: [
                    // This is necessary to enable JSDOM usage in Lambda.
                    // https://rspack.dev/plugins/webpack/ignore-plugin
                    new rspack.IgnorePlugin({
                        resourceRegExp: /canvas/,
                        contextRegExp: /jsdom$/
                    })
                ]
            }
        },
        mode,
        plugins: [
            // pluginTypeCheck({
            //     tsCheckerOptions: {
            //         typescript: { configFile: paths.fn.tsConfig },
            //         async: mode === "development"
            //     }
            // })
        ]
    };
};

const getPaths = cwd => {
    const fnRootFolderPath = cwd;
    const fnOutputFolderPath = path.join(fnRootFolderPath, "build");
    const fnEntryFilePath = path.join(fnRootFolderPath, "src", "index.ts");

    const fnTsConfigFilePath = path.join(fnRootFolderPath, "tsconfig.json");

    return {
        cwd,
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
