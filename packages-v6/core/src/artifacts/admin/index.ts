import fs from "fs-extra";
import path from "path";
import { createMorphProject, getSourceFile } from "../../utils";
import { useWebiny } from "../../webiny";
import { injectSourceFromPlugins } from "./injectSourceFromPlugins";
import { BabelConfigModifier, WebpackConfigModifier } from "../bundle/config/webpack.config";
// import { bundle } from "./bundle";

interface Options {
    watch: boolean;
}

export async function buildAdmin({ watch }: Options) {
    const webiny = useWebiny();
    const outputPath = webiny.getOutputPath();
    const plugins = webiny.getPlugins().filter(pl => "admin" in pl);
    const generatedRoot = path.join(outputPath, "generated", "admin");
    const IndexJs = path.resolve(generatedRoot, "src", "index.tsx");
    const AppJs = path.resolve(generatedRoot, "src", "App.tsx");
    const Html = path.resolve(generatedRoot, "public", "index.html");

    // Create base source
    fs.copySync(__dirname + "/template", generatedRoot, { overwrite: true });

    const project = createMorphProject([AppJs]);

    const source = getSourceFile(project, AppJs)!;
    injectSourceFromPlugins(source, plugins);
    await project.save();

    // Switch to the directory where the generated code is located.
    process.chdir(generatedRoot);

    const babelConfigModifier: BabelConfigModifier = config => {
        return plugins
            .filter(plugin => "babel" in plugin.admin!)
            .reduce((config, plugin) => plugin.admin!.babel!(config), config);
    };

    const webpackConfigModifier: WebpackConfigModifier = config => {
        return plugins
            .filter(plugin => "webpack" in plugin.admin!)
            .reduce((config, plugin) => plugin.admin!.webpack!(config), config);
    };

    if (watch) {
        // Watch the app!
        const { watchApp } = await import("../bundle/watchApp");

        return watchApp({
            cwd: generatedRoot,
            entry: IndexJs,
            html: Html,
            babelConfigModifier,
            webpackConfigModifier
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
