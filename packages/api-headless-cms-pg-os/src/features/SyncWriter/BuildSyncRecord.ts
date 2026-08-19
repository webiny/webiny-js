import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { BuildSyncRecord as Abstraction } from "./abstractions/BuildSyncRecord.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { transformEntryToIndex } from "@webiny/api-headless-cms-utils-os/operations/entry/transformations/transformEntryToIndex.js";
import {
    createLatestRecordType,
    createPublishedRecordType
} from "@webiny/api-headless-cms-utils-os/operations/entry/recordType.js";
import { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { createConfigurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/Operations.js";

class BuildSyncRecordImpl implements Abstraction.Interface {
    public constructor(
        private readonly fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private readonly compressionHandler: CompressionHandler.Interface,
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(params: Abstraction.Params<T>) {
        const { model, entry, storageEntry, kind } = params;

        const indexEntry = transformEntryToIndex({
            model,
            entry,
            storageEntry,
            fieldIndexRegistry: this.fieldIndexRegistry
        });

        const isLatest = kind === "latest";
        const recordType = isLatest ? createLatestRecordType() : createPublishedRecordType();

        const document = {
            ...indexEntry,
            ...(isLatest ? { latest: true } : { published: true }),
            TYPE: recordType,
            __type: recordType
        };

        const compressed = await this.compressionHandler.compress(document);
        const configurations = createConfigurations(this.indexProvider);
        const { index } = await configurations.es({ model });

        return {
            id: `${entry.entryId}:${isLatest ? "L" : "P"}`,
            entryId: entry.entryId,
            index,
            operation: OperationType.MODIFY,
            data: JSON.stringify(compressed),
            tenant: entry.tenant
        };
    }
}

export const BuildSyncRecord = Abstraction.createImplementation({
    implementation: BuildSyncRecordImpl,
    dependencies: [
        CmsEntryOpenSearchFieldIndexRegistry,
        CompressionHandler,
        CmsModelOpenSearchIndexProvider
    ]
});
