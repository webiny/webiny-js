import path from "path";
import rspack from "@rspack/core";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { createImportValidatorPlugin } from "../importValidatorPlugin.js";

/**
 * Bundle config for a long-lived Node HTTP server (container deployments).
 *
 * Differences from the Lambda function bundler:
 * - Entry: `src/server.ts` (vs `src/index.ts`).
 * - Output filename: `server.mjs` (vs `handler.mjs`).
 * - Externals: only native deps (`sharp`); we DO NOT externalize the AWS SDK
 *   because container deployments don't have a Lambda-provided runtime — every
 *   dep needed at runtime must be bundled or installed in the runtime image.
 */
export const createRsbuildConfig = ({ cwd }) => {
    const paths = getPaths(cwd);
    const mode = getMode();

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.server.entryFile } },
        output: {
            module: true,
            target: "node",
            sourceMap: {
                js: process.env.DEBUG === "true" ? "source-map" : false
            },
            filename: {
                js: pathData => {
                    if (pathData.chunk?.name === "index") {
                        return "server.mjs";
                    }
                    return "[name].mjs";
                }
            },
            distPath: { root: paths.server.outputFolder }
        },
        performance: {
            printFileSize: false
        },
        tools: {
            rspack: {
                // Native deps that can't be bundled — must be present in the
                // runtime image's node_modules. Add to this list as new native
                // deps appear. better-sqlite3 uses CJS-style __filename to
                // locate its native bindings, which breaks when bundled into
                // an ESM output; sharp has the same constraint.
                externals: [/^sharp$/, /^better-sqlite3$/, /^bindings$/],
                resolve: {
                    fallback: {
                        bufferutil: false
                    }
                },
                plugins: [
                    new rspack.IgnorePlugin({
                        resourceRegExp: /canvas/,
                        contextRegExp: /jsdom$/
                    })
                ]
            }
        },
        mode,
        plugins: [
            createImportValidatorPlugin(),
            pluginTypeCheck({
                tsCheckerOptions: {
                    typescript: { configFile: paths.server.tsConfig },
                    async: mode === "development"
                }
            })
        ]
    });
};

const getPaths = cwd => {
    const serverRootFolderPath = cwd;
    const serverOutputFolderPath = path.join(serverRootFolderPath, "build");
    const serverEntryFilePath = path.join(serverRootFolderPath, "src", "server.ts");

    const serverTsConfigFilePath = path.join(serverRootFolderPath, "tsconfig.json");

    return {
        projectRootFolder: process.cwd(),
        server: {
            rootFolder: serverRootFolderPath,
            tsConfig: serverTsConfigFilePath,
            outputFolder: serverOutputFolderPath,
            entryFile: serverEntryFilePath
        }
    };
};

const getMode = () => {
    return process.env.NODE_ENV === "production" ? "production" : "development";
};
