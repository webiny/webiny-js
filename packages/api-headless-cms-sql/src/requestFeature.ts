import { createFeature } from "@webiny/feature/api/index.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { SqlModelStorageOpsFeature } from "~/operations/model/feature.js";
import { SqlEntryStorageOpsFeature } from "~/operations/entry/feature.js";

/**
 * Per-request half of the SQL CMS storage: the storage operations. Register it in the request (child)
 * container, after `HeadlessCmsSqlFeature` is in the root.
 *
 * - Decorators only apply to registrations in the container that holds the decorator or below it.
 *   Extensions register in the request container, so storage registered in the root can't be
 *   decorated by them.
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
