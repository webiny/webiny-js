import path from "path";
import { updateScaffoldsIndexFile } from "@webiny/cli-plugin-scaffold/utils";
import { PluginGenerator } from "~/types";

export const apiGenerator: PluginGenerator = async ({ input }) => {
    const apiScaffoldsIndexTsPath = path.join(
        "apps",
        "api",
        "graphql",
        "src",
        "plugins",
        "scaffolds",
        "index.ts"
    );

    const scaffoldsIndexPath = apiScaffoldsIndexTsPath;

    const pluginsFactory = input.pluginName + "PluginsFactory";
    const importName = "{ createPlugins as " + pluginsFactory + " }";
    const importPath = input.packageName;
    const pluginsArrayElement = pluginsFactory + '()'

    await updateScaffoldsIndexFile({
        scaffoldsIndexPath,
        importName,
        importPath,
        pluginsArrayElement
    });
};
