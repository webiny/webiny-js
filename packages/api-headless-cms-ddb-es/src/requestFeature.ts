import { createFeature } from "@webiny/feature/api/index.js";
import type { Container } from "@webiny/feature/api/index.js";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { CreateElasticsearchIndexTask } from "~/tasks/CreateElasticsearchIndexTask.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { DdbEsGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { DdbEsModelStorageOpsFeature } from "~/operations/model/feature.js";
import { DdbEsEntryStorageOpsFeature } from "~/operations/entry/feature.js";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders.js";

const resolveDbRegistry = (container: Container): DbRegistry.Interface | undefined => {
    try {
        return container.resolve(DbRegistry);
    } catch {
        return undefined;
    }
};

/**
 * Per-request half of the DynamoDB+OpenSearch CMS storage: the storage operations, the OpenSearch
 * extension points, and everything they keep state in. Register it in the request (child) container,
 * after `HeadlessCmsDdbEsFeature` is in the root.
 *
 * - Decorators only apply to registrations in the container that holds the decorator or below it.
 *   Extensions register in the request container, so the OpenSearch extension points (index, field
 *   indexes, filters, modifiers) must be registered here for extension decorators to apply.
 * - The DataLoader cache must live for one request. A root singleton outlives the request and keeps
 *   serving the entries it read first.
 * - The filter registries are mutable; a root instance would collect every request's registrations.
 */
export const HeadlessCmsDdbEsRequestFeature = createFeature({
    name: "cms.storageOperations.openSearch.request",
    register: container => {
        CmsEntryOpenSearchUtilsFeature.register(container);
        FilterRegistriesFeature.register(container);

        container.register(CreateElasticsearchIndexTask);

        // DbRegistry is per request (DbRegistryFeature), so the root entities are registered into it
        // here. Optional: not every setup registers DbRegistry.
        const dbRegistry = resolveDbRegistry(container);
        if (dbRegistry) {
            const entryEntity = container.resolve(CmsDdbEsEntryEntity);
            const entriesEsEntity = container.resolve(CmsDdbEsEntriesEsEntity);
            dbRegistry.register({
                item: entryEntity,
                app: "cms",
                tags: ["regular", entryEntity.name]
            });
            dbRegistry.register({
                item: entriesEsEntity,
                app: "cms",
                tags: ["es", entriesEsEntity.name]
            });
        }

        DdbEsGroupStorageOpsFeature.register(container);
        DdbEsModelStorageOpsFeature.register(container);
        DdbEsEntryStorageOpsFeature.register(container);

        container.register(DataLoadersHandler).inSingletonScope();
    }
});
