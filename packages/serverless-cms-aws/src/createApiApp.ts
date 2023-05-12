import { PulumiAppParam } from "@webiny/pulumi";
import { createApiPulumiApp, CreateApiPulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import {
    executeDataMigrations,
    generateCommonHandlers,
    generateDdbHandlers,
    generateDdbEsHandlers,
    injectWcpTelemetryClientCode
} from "./api/plugins";

export { ApiOutput } from "@webiny/pulumi-aws";

export interface CreateApiAppParams extends CreateApiPulumiAppParams {
    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<
        | boolean
        | {
              domainName: string;
              indexPrefix: string;
          }
    >;

    plugins?: PluginCollection;
}

export function createApiApp(projectAppParams: CreateApiAppParams = {}) {
    const builtInPlugins = [
        injectWcpTelemetryClientCode,
        generateCommonHandlers,
        executeDataMigrations
    ];

    if (projectAppParams.elasticSearch) {
        builtInPlugins.push(generateDdbEsHandlers);
    } else {
        builtInPlugins.push(generateDdbHandlers);
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
