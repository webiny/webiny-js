import { createApiPulumiApp, CreateApiPulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import {
    ensureCoreDeployed,
    executeDataMigrations,
    generateCommonHandlers,
    generateDdbEsHandlers,
    generateDdbHandlers,
    injectWcpTelemetryClientCode
} from "./api/plugins";

export { ApiOutput } from "@webiny/pulumi-aws";

export interface CreateApiAppParams extends CreateApiPulumiAppParams {
    plugins?: PluginCollection;
}

export function createApiApp(projectAppParams: CreateApiAppParams = {}) {
    const builtInPlugins = [
        ensureCoreDeployed,
        injectWcpTelemetryClientCode,
        generateCommonHandlers,
        executeDataMigrations
    ];

    if (projectAppParams.elasticSearch || projectAppParams.openSearch) {
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
                depth: 5,

                // By default, we only enable local development for the "graphql" function.
                // This can be changed down the line by passing another set of values
                // to the "watch" command.
                function: "graphql"
            }
        },
        pulumi: createApiPulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
