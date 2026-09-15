import path from "path";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { createImportValidatorPlugin } from "../importValidatorPlugin.js";

const DEFAULT_WEBINY_INFRA_API_MAX_BUNDLE_SIZE = 6_291_456; // 6 MB

export const createRsbuildConfig = async ({ cwd, enforceMaxBundleSize }) => {
    // Must be a dynamic import — see rslibCompile.js for the reason.
    const { default: rspack } = await import("@rspack/core");
    const paths = getPaths(cwd);
    const mode = getMode();
    const isDebugEnabled = process.env.DEBUG === "true";
    // NOTE: dirty for now — sniffing the hosting type off an env var here. Ideally the build config
    // wouldn't know about hosting types at all: the caller (createBuildFunction, or the flavour's own
    // build layer) would pass in the externals policy + assetPrefix as options, keeping this file
    // hosting-agnostic. Good enough while the server hosting type is ALPHA; revisit when it settles.
    const isServer = process.env.WEBINY_HOSTING_TYPE === "server";

    // Configurable via WEBINY_INFRA_API_MAX_BUNDLE_SIZE (bytes).
    // Only enforced during build — watch mode skips size checks.
    const maxBundleSize =
        parseInt(process.env.WEBINY_INFRA_API_MAX_BUNDLE_SIZE) ||
        DEFAULT_WEBINY_INFRA_API_MAX_BUNDLE_SIZE;

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.fn.entryFile } },
        // Resolve chunk/asset URLs relative to the running module, not from an absolute root. The
        // server's bg-tasks worker chunk is spawned via `new Worker(new URL("...", import.meta.url))`
        // and rsbuild's default publicPath "/" turns that into an ABSOLUTE url ("/xyz.mjs"), which
        // resolves to the filesystem root and can't be found. "auto" resolves it relative to the module
        // (handler.mjs) instead, so the chunk loads from build/. publicPath comes from
        // `output.assetPrefix` in production and `dev.assetPrefix` in development (watch runs
        // `rsbuild.build({ watch: true })` under NODE_ENV=development), so set BOTH. Not gated to the
        // server hosting type: AWS has no worker chunks so it's a no-op there, and for any other
        // (async import) chunks "auto" is at least as correct as "/" (Lambda runs from its own dir too).
        dev: { assetPrefix: "auto" },
        output: {
            module: true,
            target: "node",
            assetPrefix: "auto",
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
                output: {
                    // Declares the entry's exports as the bundle's public API, so ALL of them survive.
                    //
                    // Nothing imports an entry's exports, so without this rspack treats any unused one
                    // as dead: it dropped `streamHandler` AND every module reachable only from it. The
                    // api bundle then exported just `handler` and contained zero streaming code, so the
                    // response-streaming Lambda (`handler.streamHandler`) had no handler to load and
                    // failed at cold start. `handler` survived only by accident of being first.
                    //
                    // To verify after changing anything here, grep the built bundle:
                    //   .webiny/workspace/apps/api/graphql/build/_handler.mjs
                    // It must export BOTH `handler` and `streamHandler`. Removing this line takes the
                    // export count back to one — silently, with a green build.
                    library: { type: "module" }
                },
                ...(enforceMaxBundleSize && {
                    performance: {
                        hints: "error",
                        maxEntrypointSize: maxBundleSize,
                        maxAssetSize: maxBundleSize
                    }
                }),
                // Both hosting types bundle; externalize only what genuinely can't be bundled.
                // sharp is a native .node binary; knex statically require()s a driver for every SQL
                // dialect (bundling pulls in uninstalled ones) and lazily loads only the configured
                // one at runtime (e.g. better-sqlite3). AWS additionally externalizes aws-sdk (the
                // Lambda runtime provides it). Server ships these in build/node_modules — the build's
                // packaging step (CI/Linux) copies them, natives included.
                externals: isServer
                    ? [/^sharp$/, /^knex(\/|$)/]
                    : [/^@aws-sdk/, /^aws-sdk$/, /^sharp$/, /^knex(\/|$)/],
                plugins: [
                    // Ignore optional `canvas` native module required by jsdom.
                    // https://rspack.dev/plugins/webpack/ignore-plugin
                    new rspack.IgnorePlugin({
                        resourceRegExp: /^canvas$/,
                        contextRegExp: /jsdom/
                    })
                ],
                resolve: {
                    fallback: {
                        // Disable optional native dependency used by 'ws' package for performance optimizations.
                        // Not needed in Lambda environment and can cause bundling/deployment issues.
                        bufferutil: false
                    }
                },
                // bree's root-jobs loader does `await import(importUrl)` on a path it builds at runtime,
                // which rspack can't resolve statically, so it reports a critical dependency. That import
                // sits behind `if (this.config.root && ...)` (node_modules/bree/src/index.js), and
                // BreeSchedulerService constructs Bree with `root: false` — the branch never runs, and
                // nothing is missing from the bundle. Matched narrowly so a genuine expression-based
                // import anywhere else still gets reported.
                ignoreWarnings: [
                    {
                        module: /node_modules[\\/]bree[\\/]/,
                        message: /Critical dependency: the request of a dependency is an expression/
                    }
                ]
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
