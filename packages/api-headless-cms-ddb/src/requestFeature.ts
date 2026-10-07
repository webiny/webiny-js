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
 * - @webiny/di applies a decorator only if it sits in the same container as the registration it
 *   decorates, or in one of that container's parents. Extensions register their decorators in the
 *   request container, so with the storage operations in the root, an extension decorator on one of
 *   them (e.g. `ListModelsStorageOperation`) would be skipped without an error. Registering them
 *   here puts the decorator and its target in the same container.
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
