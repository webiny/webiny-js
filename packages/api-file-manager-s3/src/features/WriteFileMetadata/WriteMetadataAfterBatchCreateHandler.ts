import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { FileAfterBatchCreateHandler } from "@webiny/api-file-manager/features/file/CreateFilesInBatch/events.js";
import { MetadataWriter } from "./MetadataWriter.js";

const S3_BUCKET = process.env.S3_BUCKET;

class WriteMetadataAfterBatchCreateHandlerImpl implements FileAfterBatchCreateHandler.Interface {
    private readonly metadataWriter: MetadataWriter;

    constructor(tenantContext: TenantContext.Interface) {
        this.metadataWriter = new MetadataWriter(tenantContext, String(S3_BUCKET));
    }

    async handle(event: FileAfterBatchCreateHandler.Event): Promise<void> {
        const { files } = event.payload;
        await this.metadataWriter.write(files);
    }
}

export const WriteMetadataAfterBatchCreateHandler =
    FileAfterBatchCreateHandler.createImplementation({
        implementation: WriteMetadataAfterBatchCreateHandlerImpl,
        dependencies: [TenantContext]
    });
