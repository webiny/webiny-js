import path from "path";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import tailwindcss from "@tailwindcss/postcss";

export const createRsbuildConfig = () => {
    const paths = getPaths();
    const envVars = getEnvVars();
    const mode = getMode();

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.admin.entryFile }, define: envVars },
        output: { distPath: { root: paths.admin.outputFolder } },
        mode,
        dev: { hmr: true },
        tools: {
            postcss: (_, { addPlugins }) => {
                addPlugins(
                    tailwindcss({
                        base: path.join(paths.cwd, "packages")
                    })
                );
            }
        },
        html: {
            title: "Webiny",
            favicon: paths.admin.faviconFile
        },
        plugins: [
            pluginTypeCheck({
                tsCheckerOptions: {
                    typescript: { configFile: paths.admin.tsConfig },
                    async: mode === "development"
                }
            }),
            pluginReact(),
            pluginSass(),
            pluginSvgr({
                mixedImport: true,
                svgrOptions: {
                    exportType: "named",
                    svgoConfig: {
                        plugins: [
                            {
                                name: "preset-default",
                                params: { overrides: { removeViewBox: false } }
                            }
                        ]
                    }
                }
            })
        ]
    });
};

const getPaths = () => {
    const cwd = process.cwd();
    const adminRootFolderPath = path.join(cwd, ".webiny", "workspace", "apps", "admin");
    const adminOutputFolderPath = path.join(adminRootFolderPath, "build");
    const adminEntryFilePath = path.join(adminRootFolderPath, "src", "index.tsx");
    const adminFaviconFilePath = path.join(
        adminRootFolderPath,
        "public",
        "favicons",
        "favicon.ico"
    );

    const adminTsConfigFilePath = path.join(adminRootFolderPath, "tsconfig.json");

    return {
        cwd,
        admin: {
            rootFolder: adminRootFolderPath,
            tsConfig: adminTsConfigFilePath,
            outputFolder: adminOutputFolderPath,
            entryFile: adminEntryFilePath,
            faviconFile: adminFaviconFilePath
        }
    };
};

const getEnvVars = () => {
    const raw = Object.keys(process.env)
        .filter(key => {
            if (new RegExp(/^REACT_APP_/i).test(key)) {
                return true;
            }

            return new RegExp(/^WEBINY_ADMIN_/i).test(key);
        })
        .reduce(
            (env, key) => {
                env[key] = process.env[key];
                return env;
            },
            {
                // Useful for determining whether we're running in production mode.
                // Most importantly, it switches React into the correct mode.
                NODE_ENV: process.env.NODE_ENV || "development"
            }
        );

    // Stringify all values so we can feed into Webpack DefinePlugin.
    // Provide values one by one, not as a single process.env object,
    // because otherwise plugin will put a big JSON object every time process.env is used in code.
    // This way minifier also removes redundant code on prod (like if(process.env.NODE_ENV === 'development')).
    const stringified = {};
    for (const key of Object.keys(raw)) {
        stringified[`process.env.${key}`] = JSON.stringify(raw[key]);
    }

    return stringified;
};

const getMode = () => {
    return process.env.NODE_ENV === "production" ? "production" : "development";
};
