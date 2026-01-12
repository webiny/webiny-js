import path from "path";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import tailwindcss from "@tailwindcss/postcss";
import fs from "fs";

export const createRsbuildConfig = ({ cwd }) => {
    const paths = getPaths(cwd);
    const envVars = getEnvVars();
    const mode = getMode();

    return /** @type {import("@rsbuild/core").RsbuildConfig} */ ({
        source: { entry: { index: paths.admin.entryFile }, define: envVars },
        output: { distPath: { root: paths.admin.outputFolder } },
        mode,
        dev: { hmr: true },
        performance: {
            printFileSize: false
        },
        tools: {
            postcss: (_, { addPlugins }) => {
                addPlugins(
                    tailwindcss({
                        base: getTailwindBasePath(paths.projectRootFolder)
                    })
                );
            }
        },
        server: { port: 3001 },
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
                            },
                            {
                                name: "removeAttrs",
                                params: { attrs: "(width|height)" }
                            }
                        ]
                    }
                }
            })
        ]
    });
};

const getPaths = cwd => {
    const adminRootFolderPath = cwd;
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
        projectRootFolder: process.cwd(),
        admin: {
            rootFolder: adminRootFolderPath,
            tsConfig: adminTsConfigFilePath,
            outputFolder: adminOutputFolderPath,
            entryFile: adminEntryFilePath,
            faviconFile: adminFaviconFilePath
        }
    };
};

const getTailwindBasePath = projectRootFolderPath => {
    const adminUiPkgPath = path.join(projectRootFolderPath, "packages", "admin-ui");

    const isWebinyJsRepo = fs.existsSync(adminUiPkgPath);

    if (isWebinyJsRepo) {
        return path.join(projectRootFolderPath, "packages");
    }

    return path.join(projectRootFolderPath, "node_modules", "@webiny");
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
    const envVarsAsStrings = {};
    for (const key of Object.keys(raw)) {
        envVarsAsStrings[`process.env.${key}`] = JSON.stringify(raw[key]);
    }

    return envVarsAsStrings;
};

const getMode = () => {
    return process.env.NODE_ENV === "production" ? "production" : "development";
};
