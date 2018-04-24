import findUp from "find-up";
import fs from "fs-extra";

import { appEntry, SpaConfigPlugin, server } from "./spa";

/**
 * Function to return default export from either ES or CJS module.
 * @param module
 * @returns {*}
 */
const interopModule = module => (module.default ? module.default : module);

/**
 * Prepare webpack configs
 *
 * @param projectRoot
 * @param appRoot
 * @returns {Promise<{vendorConfig: *, appConfig: *}>}
 */
const prepareWebpack = async (projectRoot, appRoot) => {
    const UrlGenerator = interopModule(await import("./spa/urlGenerator"));
    const urlGenerator = new UrlGenerator();

    // Import app configuration
    const appWebpack = interopModule(await import(findUp.sync(["webpack.js"], { cwd: appRoot })));

    // Vendor base config
    const baseVendor = interopModule(await import("./spa/webpack.vendor"))({
        projectRoot,
        appRoot
    });

    // Vendor DLL config
    const vendorConfig = appWebpack.vendor({ config: baseVendor });

    // App config
    const baseAppWebpack = interopModule(await import("./spa/webpack.app"))({
        projectRoot,
        appRoot,
        urlGenerator
    });

    const appConfig = appWebpack.app({
        urlGenerator,
        config: baseAppWebpack
    });

    return { vendorConfig, appConfig };
};

export const spa = {
    appEntry,
    SpaConfigPlugin,
    server
};

export async function developApp(projectRoot, appRoot, clean = false) {
    const { vendorConfig, appConfig } = await prepareWebpack(projectRoot, appRoot);

    // Create app build function
    const buildApp = async () => {
        const browserSync = await interopModule(
            await import(findUp.sync(["server.js"], { cwd: appRoot }))
        );
        browserSync({ config: appConfig, projectRoot, appRoot });
    };

    // Go straight to app build if vendor exists
    if (fs.existsSync(vendorConfig.output.path + "/vendor.manifest.json") && !clean) {
        return buildApp();
    }

    // Run build
    const webpack = await import("webpack");
    webpack(vendorConfig).run(async function(err, stats) {
        if (err) console.error(err);

        console.log(stats.toString({ colors: true }));
        return buildApp();
    });
}

export async function buildApp(projectRoot, appRoot) {
    const { vendorConfig, appConfig } = await prepareWebpack(projectRoot, appRoot);

    // Run vendor build, then app build
    const webpack = await import("webpack");
    webpack(vendorConfig).run(async function(err, stats) {
        if (err) console.error(err);

        console.log(stats.toString({ colors: true }));

        webpack(appConfig).run(function(err, stats) {
            if (err) console.error(err);

            console.log(stats.toString({ colors: true }));
        });
    });
}

export async function serveApp(projectRoot, appRoot) {
    const server = interopModule(await import(findUp.sync(["server.js"], { cwd: appRoot })));
    server({ projectRoot, appRoot });
}
