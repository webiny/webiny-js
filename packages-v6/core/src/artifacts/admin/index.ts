import fs from "fs-extra";
import path from "path";
import { createMorphProject, getSourceFile } from "../../utils";
import { useWebiny } from "../../webiny";
import { injectSourceFromPlugins } from "./injectSourceFromPlugins";
import { BabelConfigModifier, WebpackConfigModifier } from "../bundle/config/webpack.config";
import { Plugin, PluginAdminConfig } from "~/definePlugin";

interface Options {
    watch: boolean;
}

interface AdminPlugin extends Plugin {
    admin: PluginAdminConfig;
}

interface AdminConfigWithBabel extends PluginAdminConfig {
    babel: BabelConfigModifier;
}

interface AdminConfigWithWebpack extends PluginAdminConfig {
    webpack: WebpackConfigModifier;
}

interface AdminBabelPlugin extends AdminPlugin {
    admin: AdminConfigWithBabel;
}

interface AdminWebpackPlugin extends AdminPlugin {
    admin: AdminConfigWithWebpack;
}

function isAdminPlugin(plugin: Plugin | AdminPlugin): plugin is AdminPlugin {
    return plugin.admin !== undefined;
}

function hasBabelModifier(plugin: AdminPlugin | AdminBabelPlugin): plugin is AdminBabelPlugin {
    return plugin.admin.babel !== undefined;
}

function hasWebpackModifier(
    plugin: AdminPlugin | AdminWebpackPlugin
): plugin is AdminWebpackPlugin {
    return plugin.admin.webpack !== undefined;
}

export async function buildAdmin({ watch }: Options) {
    const webiny = useWebiny();
    const outputPath = webiny.getOutputPath();
    const adminPlugins = webiny.getPlugins().filter(isAdminPlugin);

    const generatedRoot = path.join(outputPath, "generated", "admin");
    const IndexJs = path.resolve(generatedRoot, "src", "index.tsx");
    const AppJs = path.resolve(generatedRoot, "src", "App.tsx");
    const Html = path.resolve(generatedRoot, "public", "index.html");

    // Create base source
    fs.copySync(__dirname + "/template", generatedRoot, { overwrite: true });

    const project = createMorphProject([AppJs]);

    const source = getSourceFile(project, AppJs);
    if (!source) {
        throw Error("Missing admin App.tsx file.");
    }

    injectSourceFromPlugins(source, adminPlugins);
    await project.save();

    // Switch to the directory where the generated code is located.
    process.chdir(generatedRoot);

    const babelConfigModifier: BabelConfigModifier = config => {
        return adminPlugins
            .filter(hasBabelModifier)
            .map(plugin => plugin.admin.babel)
            .reduce((config, modifier) => modifier(config), config);
    };

    const webpackConfigModifier: WebpackConfigModifier = config => {
        return adminPlugins
            .filter(hasWebpackModifier)
            .map(plugin => plugin.admin.webpack)
            .reduce((config, modifier) => modifier(config), config);
    };

    if (watch) {
        // Watch the app!
        const { watchApp } = await import("../bundle/watchApp");

        // Return a Promise that will never be resolved, to keep the process running.
        return new Promise(() => {
            watchApp({
                cwd: generatedRoot,
                entry: IndexJs,
                html: Html,
                babelConfigModifier,
                webpackConfigModifier
            });
        });
    }

    // Build the app!
    const { buildApp } = await import("../bundle/buildApp");

    await buildApp({
        cwd: generatedRoot,
        entry: IndexJs,
        html: Html,
        output: path.join(outputPath, "dist", "admin"),
        babelConfigModifier,
        webpackConfigModifier
    });
}
