import { createFeature } from "@webiny/feature/api/index.js";
import { PgSchemaManager } from "./schema/PgSchema.js";
import { ScopeRegistryImplementation } from "./scopes/ScopeRegistry.js";
import { SearchIndexerImplementation } from "./search/SearchIndexer.js";
import { EntrySearchImplementation } from "./search/EntrySearch.js";
import { ScopeIndexModeImplementation } from "./indexMode/ScopeIndexMode.js";
import { PgModelStorageSync } from "./sync/PgModelStorageSync.js";
import { PgDeleteModel } from "~/operations/model/PgDeleteModel.js";
import { EntryValuesPatcherImplementation } from "~/features/entryValuesPatcher/EntryValuesPatcher.js";

export const PgCoreFeature = createFeature({
    name: "cms.pg.core",
    register: container => {
        // The schema manager remembers that the tables exist, so it lives for the process.
        container.register(PgSchemaManager).inSingletonScope();
        // These depend on the container-scoped filter registries, so they stay transient.
        container.register(ScopeRegistryImplementation);
        container.register(SearchIndexerImplementation);
        // Bulk value updates inside a write transaction (e.g. ACO folder paths after a rename).
        container.register(EntryValuesPatcherImplementation);
        container.register(EntrySearchImplementation);
        container.register(ScopeIndexModeImplementation);
        // Background work after a model change (the CMS's `cmsModelStorageSync` task calls it).
        container.register(PgModelStorageSync);
        // A deleted model's scope is cleared, so a model created under the same id starts clean.
        container.registerDecorator(PgDeleteModel);
    }
});
