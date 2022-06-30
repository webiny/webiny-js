import { createCorePulumiApp, CreateCorePulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { generateDdbToEsHandler } from "./core/plugins";

export interface CreateCoreAppParams extends CreateCorePulumiAppParams {
    plugins?: PluginCollection;
}

export function createCoreApp(projectAppParams: CreateCoreAppParams = {}) {
    const builtInPlugins = [];
    if (projectAppParams.elasticSearch) {
        builtInPlugins.push(generateDdbToEsHandler);
    }

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "core",
        name: "Core",
        description: "Your project's stateful cloud infrastructure resources.",
        pulumi: createCorePulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
