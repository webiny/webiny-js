import { PulumiAppParam } from "@webiny/pulumi";
import { createApiPulumiApp, CreateApiPulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import {
    generateDdbHandlers,
    generateDdbEsHandlers,
    generateCommonHandlers,
    injectWcpTelemetryClientCode
} from "./api/plugins";

export interface CreateApiAppParams extends CreateApiPulumiAppParams {
    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<boolean>;

    plugins?: PluginCollection;
}

export function createApiApp(projectAppParams: CreateApiAppParams = {}) {
    const builtInPlugins = [injectWcpTelemetryClientCode, generateCommonHandlers];
    if (projectAppParams.elasticSearch) {
        builtInPlugins.push(generateDdbEsHandlers);
    } else {
        builtInPlugins.push(generateDdbHandlers);
    }

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "api",
        name: "API",
        description:
            "Represents cloud infrastructure needed for supporting your project's (GraphQL) API.",
        cli: {
            // Default args for the "yarn webiny watch ..." command.
            watch: {
                // Watch five levels of dependencies, starting from this project application.
                depth: 5
            }
        },
        pulumi: createApiPulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
