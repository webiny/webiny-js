import { createImplementation } from "@webiny/feature/api";
import { CmsEntryStorageOpsRegistrar } from "@webiny/api-headless-cms/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { registerCmsEntryStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/registerCmsEntryStorageOperations.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import type { Container } from "@webiny/di";

class DdbCmsEntryStorageOpsRegistrarImpl implements CmsEntryStorageOpsRegistrar.Interface {
    constructor(private entryEntity: CmsDdbEntryEntity.Interface) {}

    register(container: Container): void {
        const entries = createEntriesStorageOperations({
            entity: this.entryEntity,
            container
        });

        registerCmsEntryStorageOperations(container, entries);
    }
}

export const DdbCmsEntryStorageOpsRegistrar = createImplementation({
    abstraction: CmsEntryStorageOpsRegistrar,
    implementation: DdbCmsEntryStorageOpsRegistrarImpl,
    dependencies: [CmsDdbEntryEntity]
});
