import { createCorePulumiApp, CreateCorePulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { generateDdbToEsHandler } from "./core/plugins";

export { CoreOutput } from "@webiny/pulumi-aws";

export interface CreateCoreAppParams extends CreateCorePulumiAppParams {
    plugins?: PluginCollection;
}

export function createCoreApp(projectAppParams: CreateCoreAppParams = {}) {
    const builtInPlugins = [];
    if (projectAppParams.elasticSearch) {
        builtInPlugins.push(generateDdbToEsHandler);
    }

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    if (projectAppParams.elasticSearch) {
        const { elasticSearch } = projectAppParams;
        if (typeof elasticSearch === "object") {
            if (elasticSearch.domainName) {
                process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME = elasticSearch.domainName;
            }

            if (elasticSearch.indexPrefix) {
                process.env.ELASTIC_SEARCH_INDEX_PREFIX = elasticSearch.indexPrefix;
            }
        }
    }

    return {
        id: "core",
        name: "Core",
        description: "Your project's stateful cloud infrastructure resources.",
        pulumi: createCorePulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
