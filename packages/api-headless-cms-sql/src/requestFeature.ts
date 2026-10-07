import { createFeature } from "@webiny/feature/api/index.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { SqlModelStorageOpsFeature } from "~/operations/model/feature.js";
import { SqlEntryStorageOpsFeature } from "~/operations/entry/feature.js";

/**
 * Per-request half of the SQL CMS storage: the storage operations. Register it in the request (child)
 * container, after `HeadlessCmsSqlFeature` is in the root.
 *
 * - @webiny/di applies a decorator only if it sits in the same container as the registration it
 *   decorates, or in one of that container's parents. Extensions register their decorators in the
 *   request container, so with the storage operations in the root, an extension decorator on one of
 *   them (e.g. `ListModelsStorageOperation`) would be skipped without an error. Registering them
 *   here puts the decorator and its target in the same container.
 * - The filter registries are mutable; a root instance would collect every request's registrations.
 */
export const HeadlessCmsSqlRequestFeature = createFeature({
    name: "cms.storageOperations.sql.request",
    register: container => {
        FilterRegistriesFeature.register(container);

        SqlGroupStorageOpsFeature.register(container);
        SqlModelStorageOpsFeature.register(container);
        SqlEntryStorageOpsFeature.register(container);
    }
});
