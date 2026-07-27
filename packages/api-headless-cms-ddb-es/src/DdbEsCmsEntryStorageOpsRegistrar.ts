import { createImplementation } from "@webiny/feature/api";
import { CmsEntryStorageOpsRegistrar } from "@webiny/api-headless-cms/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { registerCmsEntryStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/registerCmsEntryStorageOperations.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchValuesModifier
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { Container } from "@webiny/di";

class DdbEsCmsEntryStorageOpsRegistrarImpl implements CmsEntryStorageOpsRegistrar.Interface {
    constructor(
        private entryEntity: CmsDdbEsEntryEntity.Interface,
        private entriesEsEntity: CmsDdbEsEntriesEsEntity.Interface,
        private openSearchClient: OpenSearchClient.Interface
    ) {}

    register(container: Container): void {
        const entries = createEntriesStorageOperations({
            entity: this.entryEntity,
            esEntity: this.entriesEsEntity,
            elasticsearch: this.openSearchClient.use(),
            container,
            fieldRegistry: container.resolve(CmsModelFieldToGraphQLRegistry),
            fieldIndexRegistry: container.resolve(CmsEntryOpenSearchFieldIndexRegistry),
            compressionHandler: container.resolve(CompressionHandler),
            valuesModifiers: container.resolveAll(CmsEntryOpenSearchValuesModifier)
        });

        registerCmsEntryStorageOperations(container, entries);
    }
}

export const DdbEsCmsEntryStorageOpsRegistrar = createImplementation({
    abstraction: CmsEntryStorageOpsRegistrar,
    implementation: DdbEsCmsEntryStorageOpsRegistrarImpl,
    dependencies: [CmsDdbEsEntryEntity, CmsDdbEsEntriesEsEntity, OpenSearchClient]
});
