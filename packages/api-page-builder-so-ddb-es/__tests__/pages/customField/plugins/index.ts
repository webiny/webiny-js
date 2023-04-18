import { Plugin } from "@webiny/plugins/types";
import { createAcoPagePlugins } from "./createAcoPagePlugins";
import { createElasticsearchDataMappingPlugin } from "./createElasticsearchDataMappingPlugin";
import { createElasticsearchFieldPlugin } from "./createElasticsearchFieldPlugin";
import { createGraphQlSchemaPlugins } from "./createGraphQlSchemaPlugins";
import { createPageLifecycleHook } from "./createPageLifecycleHooks";

export const createCustomFieldPlugins = (): Plugin[] => {
    return [
        ...createGraphQlSchemaPlugins(),
        ...createAcoPagePlugins(),
        createElasticsearchFieldPlugin(),
        createElasticsearchDataMappingPlugin(),
        createPageLifecycleHook()
    ];
};
