import path from "path";

import { appEntry, SpaConfigPlugin, server } from "./spa";

export const spa = {
    appEntry,
    SpaConfigPlugin,
    server
};

export async function developApp(projectRoot, appRoot) {
    const { default: UrlGenerator } = await import("./spa/urlGenerator");
    const urlGenerator = new UrlGenerator();

    const { default: server } = await import(path.join(appRoot, "server.js"));
    const baseWebpack = (await import("./spa/webpack.config")).default({
        projectRoot,
        appRoot,
        urlGenerator
    });

    const appWebpack = (await import(path.join(appRoot, "webpack.config.js"))).default({
        urlGenerator,
        config: baseWebpack
    });

    const browserSync = await server;
    browserSync({ config: appWebpack, projectRoot, appRoot });
}

export async function buildApp(projectRoot, appRoot) {
    const { default: UrlGenerator } = await import("./spa/urlGenerator");
    const urlGenerator = new UrlGenerator();

    const baseWebpack = await import("./spa/webpack.config")({
        projectRoot,
        appRoot,
        urlGenerator
    });

    const appWebpack = (await import(path.join(appRoot, "webpack.config.js"))).default({
        config: baseWebpack,
        urlGenerator
    });

    const webpack = await import("webpack");
    webpack(appWebpack).run(function(err, stats) {
        if (err) console.error(err);

        console.log(stats.toString({ colors: true }));
    });
}
