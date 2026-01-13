import { FileAfterCreateHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { MetadataWriter } from "./MetadataWriter.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

class WriteMetadataAfterCreateHandlerImpl implements FileAfterCreateHandler.Interface {
    private readonly metadataWriter: MetadataWriter;

    constructor(
        tenantContext: TenantContext.Interface,
        keyValueStore: GlobalKeyValueStore.Interface
    ) {
        this.metadataWriter = new MetadataWriter(tenantContext, keyValueStore);
    }

    async handle(event: FileAfterCreateHandler.Event): Promise<void> {
        const { file } = event.payload;
        await this.metadataWriter.write([file]);
    }
}

export const WriteMetadataAfterCreateHandler = FileAfterCreateHandler.createImplementation({
    implementation: WriteMetadataAfterCreateHandlerImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
