import { createCorePulumiApp, CreateCorePulumiAppParams } from "@webiny/pulumi-aws/enterprise";
import { PluginCollection } from "@webiny/plugins/types";
import { generateDdbToEsHandler, checkEsServiceRole } from "~/core/plugins";

export { CoreOutput } from "@webiny/pulumi-aws";

export interface CreateCoreAppParams extends CreateCorePulumiAppParams {
    plugins?: PluginCollection;
}

export function createCoreApp(projectAppParams: CreateCoreAppParams = {}) {
    const builtInPlugins = [];
    if (projectAppParams.elasticSearch || projectAppParams.openSearch) {
        builtInPlugins.push(generateDdbToEsHandler, checkEsServiceRole);
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
