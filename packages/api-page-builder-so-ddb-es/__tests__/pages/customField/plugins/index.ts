import { Plugin } from "@webiny/plugins/types";
import { createAcoPlugins } from "./createAcoPlugins";
import { createElasticsearchDataMappingPlugin } from "./createElasticsearchDataMappingPlugin";
import { createElasticsearchFieldPlugin } from "./createElasticsearchFieldPlugin";
import { createGraphQlSchemaPlugins } from "./createGraphQlSchemaPlugins";
import { createPageLifecycleHook } from "./createPageLifecycleHooks";

export const createCustomFieldPlugins = (): Plugin[] => {
    return [
        ...createGraphQlSchemaPlugins(),
        ...createAcoPlugins(),
        createElasticsearchFieldPlugin(),
        createElasticsearchDataMappingPlugin(),
        createPageLifecycleHook()
    ];
};
