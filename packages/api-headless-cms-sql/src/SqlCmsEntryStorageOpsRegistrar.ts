import { createImplementation } from "@webiny/feature/api";
import { CmsEntryStorageOpsRegistrar } from "@webiny/api-headless-cms/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.js";
import { registerCmsEntryStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/registerCmsEntryStorageOperations.js";
import { SqlEntryOperations } from "~/operations/entry/abstractions/SqlEntryOperations.js";
import type { Container } from "@webiny/di";

class SqlCmsEntryStorageOpsRegistrarImpl implements CmsEntryStorageOpsRegistrar.Interface {
    constructor(private entryOperations: SqlEntryOperations.Interface) {}

    register(container: Container): void {
        registerCmsEntryStorageOperations(container, this.entryOperations);
    }
}

export const SqlCmsEntryStorageOpsRegistrar = createImplementation({
    abstraction: CmsEntryStorageOpsRegistrar,
    implementation: SqlCmsEntryStorageOpsRegistrarImpl,
    dependencies: [SqlEntryOperations]
});
