import { FileAfterBatchCreateEventHandler } from "~/features/file/CreateFilesInBatch/events.js";
import { MetadataWriter } from "./abstractions.js";

class WriteMetadataAfterBatchCreateHandlerImpl
    implements FileAfterBatchCreateEventHandler.Interface
{
    private readonly metadataWriter: MetadataWriter.Interface;

    public constructor(metadataWriter: MetadataWriter.Interface) {
        this.metadataWriter = metadataWriter;
    }

    public async handle(event: FileAfterBatchCreateEventHandler.Event): Promise<void> {
        const { files } = event.payload;
        await this.metadataWriter.write(files);
    }
}

export const WriteMetadataAfterBatchCreateHandler =
    FileAfterBatchCreateEventHandler.createImplementation({
        implementation: WriteMetadataAfterBatchCreateHandlerImpl,
        dependencies: [MetadataWriter]
    });
