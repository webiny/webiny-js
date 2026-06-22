import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileAfterBatchCreateEventHandler } from "~/features/file/CreateFilesInBatch/events.js";
import { MetadataWriter } from "./MetadataWriter.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

class WriteMetadataAfterBatchCreateHandlerImpl
    implements FileAfterBatchCreateEventHandler.Interface
{
    private readonly metadataWriter: MetadataWriter;

    constructor(
        tenantContext: TenantContext.Interface,
        keyValueStore: GlobalKeyValueStore.Interface
    ) {
        this.metadataWriter = new MetadataWriter(tenantContext, keyValueStore);
    }

    async handle(event: FileAfterBatchCreateEventHandler.Event): Promise<void> {
        const { files } = event.payload;
        await this.metadataWriter.write(files);
    }
}

export const WriteMetadataAfterBatchCreateHandler =
    FileAfterBatchCreateEventHandler.createImplementation({
        implementation: WriteMetadataAfterBatchCreateHandlerImpl,
        dependencies: [TenantContext, GlobalKeyValueStore]
    });
