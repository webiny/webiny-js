import fs from "fs-extra";
import path from "path";
import { createMorphProject, getSourceFile } from "../../utils";
import { useWebiny } from "../../webiny";
import { injectSourceFromPlugins } from "./injectSourceFromPlugins";
import { bundle } from "./bundle";

interface Options {
    watch: boolean;
}

export async function buildAdmin({ watch }: Options) {
    const webiny = useWebiny();
    const outputPath = webiny.getOutputPath();
    const plugins = webiny.getPlugins().filter(pl => "admin" in pl);
    const generatedRoot = path.join(outputPath, "generated", "admin");
    const IndexJs = path.resolve(generatedRoot, "index.tsx");
    const Html = path.resolve(generatedRoot, "index.html");
    const AppJs = path.resolve(generatedRoot, "App.tsx");

    // Create base source
    fs.copySync(__dirname + "/template", generatedRoot, { overwrite: true });

    const project = createMorphProject([AppJs]);

    const source = getSourceFile(project, AppJs)!;
    injectSourceFromPlugins(source, plugins);
    await project.save();

    // Build the app!
    await bundle({
        entry: IndexJs,
        html: Html,
        plugins,
        output: path.join(outputPath, "dist", "admin"),
        watch
    });
}
