import path from "path";
import fs from "node:fs";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { createImportValidatorPlugin } from "../importValidatorPlugin.js";

const DEFAULT_WEBINY_INFRA_API_MAX_BUNDLE_SIZE = 4_718_592; // 4.5 MB

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
        // Server: worker chunks (e.g. background-tasks' workerEntry, spawned via
        // `new Worker(new URL("...", import.meta.url))`) are referenced as publicPath + chunk name.
        // rsbuild's default publicPath "/" makes that an ABSOLUTE url ("/xyz.mjs"), which `new Worker()`
        // resolves to the filesystem root and can't find. "auto" makes it resolve relative to the
        // running module (handler.mjs), so the emitted chunk loads from build/. publicPath comes from
        // `output.assetPrefix` in production (`webiny build`) but from `dev.assetPrefix` in development
        // (`webiny watch`, which runs `rsbuild.build({ watch: true })` under NODE_ENV=development), so
        // BOTH must be set. Harmless for AWS (its bundle has no worker chunks); scoped to server.
        ...(isServer ? { dev: { assetPrefix: "auto" } } : {}),
        output: {
            module: true,
            target: "node",
            ...(isServer ? { assetPrefix: "auto" } : {}),
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
            }),
            // Server: mark build/ as ESM so emitted raw-.js assets load as modules. handler.mjs and
            // chunks are already .mjs, but the bree pollWorker is emitted as a plain .js asset (it's a
            // raw .js source, not compiled) — without "type": "module" Node treats it as CJS and its
            // `import` throws. Part 2 (deploy packaging) extends this package.json with dependencies +
            // a start script; here it just needs the module type.
            ...(isServer
                ? [
                      {
                          name: "webiny-server-package-json",
                          setup(api) {
                              api.onAfterBuild(() => {
                                  fs.writeFileSync(
                                      path.join(paths.fn.outputFolder, "package.json"),
                                      JSON.stringify({ type: "module" }, null, 2) + "\n"
                                  );
                              });
                          }
                      }
                  ]
                : [])
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
