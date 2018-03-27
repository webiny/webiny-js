import findUp from "find-up";

import { appEntry, SpaConfigPlugin, server } from "./spa";

const interopModule = m => (m.default ? m.default : m);

export const spa = {
    appEntry,
    SpaConfigPlugin,
    server
};

export async function developApp(projectRoot, appRoot) {
    const UrlGenerator = interopModule(await import("./spa/urlGenerator"));
    const urlGenerator = new UrlGenerator();

    const server = interopModule(await import(findUp.sync(["server.js"], { cwd: appRoot })));
    const baseWebpack = interopModule(await import("./spa/webpack.config"))({
        projectRoot,
        appRoot,
        urlGenerator
    });

    const appWebpack = interopModule(
        await import(findUp.sync(["webpack.config.js"], { cwd: appRoot }))
    )({
        urlGenerator,
        config: baseWebpack
    });

    const browserSync = await server;
    browserSync({ config: appWebpack, projectRoot, appRoot });
}

export async function buildApp(projectRoot, appRoot) {
    const UrlGenerator = interopModule(await import("./spa/urlGenerator"));
    const urlGenerator = new UrlGenerator();

    const baseWebpack = interopModule(await import("./spa/webpack.config"))({
        projectRoot,
        appRoot,
        urlGenerator
    });

    const appWebpack = interopModule(
        await import(findUp.sync(["webpack.config.js"], { cwd: appRoot }))
    )({
        config: baseWebpack,
        urlGenerator
    });

    const webpack = await import("webpack");
    webpack(appWebpack).run(function(err, stats) {
        if (err) console.error(err);

        console.log(stats.toString({ colors: true }));
    });
}

export async function serveApp(projectRoot, appRoot) {
    const server = interopModule(await import(findUp.sync(["server.js"], { cwd: appRoot })));
    server({ projectRoot, appRoot });
}
