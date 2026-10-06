import { createFeature } from "@webiny/feature/api/index.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { DdbGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { DdbModelStorageOpsFeature } from "~/operations/model/feature.js";
import { DdbEntryStorageOpsFeature } from "~/operations/entry/feature.js";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders.js";

/**
 * Per-request half of the DynamoDB CMS storage: the storage operations and everything they keep state
 * in. Register it in the request (child) container, after `HeadlessCmsDdbFeature` is in the root.
 *
 * - Decorators only apply to registrations in the container that holds the decorator or below it.
 *   Extensions register in the request container, so storage registered in the root can't be
 *   decorated by them.
 * - The DataLoader cache must live for one request. A root singleton outlives the request and keeps
 *   serving the entries it read first.
 * - The filter registries are mutable; a root instance would collect every request's registrations.
 */
export const HeadlessCmsDdbRequestFeature = createFeature({
    name: "cms.storageOperations.ddb.request",
    register: container => {
        FilterRegistriesFeature.register(container);

        DdbGroupStorageOpsFeature.register(container);
        DdbModelStorageOpsFeature.register(container);
        DdbEntryStorageOpsFeature.register(container);

        container.register(DataLoadersHandler).inSingletonScope();
    }
});
