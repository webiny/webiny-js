import { createImplementation } from "@webiny/feature/api";
import { CmsEntryStorageOpsRegistrar } from "@webiny/api-headless-cms/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.js";
import { registerCmsEntryStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/registerCmsEntryStorageOperations.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import type { Container } from "@webiny/di";

class PgOsCmsEntryStorageOpsRegistrarImpl implements CmsEntryStorageOpsRegistrar.Interface {
    register(container: Container): void {
        const entries = createEntriesStorageOperations(container);
        registerCmsEntryStorageOperations(container, entries);
    }
}

export const PgOsCmsEntryStorageOpsRegistrar = createImplementation({
    abstraction: CmsEntryStorageOpsRegistrar,
    implementation: PgOsCmsEntryStorageOpsRegistrarImpl,
    dependencies: []
});
