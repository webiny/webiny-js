import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HeadlessCmsContextEnhancer, HeadlessCmsEnhancerConfig } from "./HeadlessCmsContextEnhancer.js";
import { HeadlessCmsContextualSchema } from "./HeadlessCmsContextualSchema.js";
import { StorageOperationsFactory } from "~/features/shared/abstractions.js";
import type { IHeadlessCmsStorageOperationsFactory } from "~/features/shared/abstractions.js";
import type { ApiEndpoint } from "~/types/index.js";

export interface HeadlessCmsConfig {
    /**
     * Optional: if provided, registers the factory directly.
     * If omitted, expects StorageOperationsFactory to be registered externally.
     */
    storageOperations?: IHeadlessCmsStorageOperationsFactory<any>;
    type: ApiEndpoint;
    /** Extra plugins (e.g. CmsGraphQLSchemaPlugin) to register in ctx.plugins at runtime. */
    extraPlugins?: any[];
}

export const HeadlessCmsFeature = createFeature({
    name: "HeadlessCms",
    register(container: Container, config: HeadlessCmsConfig) {
        if (config.storageOperations) {
            container.registerInstance(StorageOperationsFactory, config.storageOperations);
        }
        container.registerInstance(HeadlessCmsEnhancerConfig, {
            type: config.type,
            extraPlugins: config.extraPlugins
        });
        container.register(HeadlessCmsContextEnhancer);
        container.register(HeadlessCmsContextualSchema);
    }
});
