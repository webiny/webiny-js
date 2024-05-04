import path from "path";
import { updateScaffoldsIndexFile } from "@webiny/cli-plugin-scaffold/utils";
import { PluginGenerator } from "~/types";

export const adminGenerator: PluginGenerator = async ({ input }) => {
    const apiScaffoldsIndexTsPath = path.join(
        "apps",
        "api",
        "graphql",
        "src",
        "plugins",
        "scaffolds",
        "index.ts"
    );

    await updateScaffoldsIndexFile({
        scaffoldsIndexPath: apiScaffoldsIndexTsPath,
        importName: input.pluginName,
        importPath: input.pluginName
    });
};
