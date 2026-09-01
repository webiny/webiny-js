import { FileAfterUpdateEventHandler } from "~/features/file/UpdateFile/events.js";
import { MetadataWriter } from "./abstractions.js";

class WriteMetadataAfterUpdateHandlerImpl implements FileAfterUpdateEventHandler.Interface {
    private readonly metadataWriter: MetadataWriter.Interface;

    public constructor(metadataWriter: MetadataWriter.Interface) {
        this.metadataWriter = metadataWriter;
    }

    public async handle(event: FileAfterUpdateEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        // Re-write the delivery metadata so changes (e.g. the image crop) propagate
        // to the asset-delivery pipeline.
        await this.metadataWriter.write([file]);
    }
}

export const WriteMetadataAfterUpdateHandler = FileAfterUpdateEventHandler.createImplementation({
    implementation: WriteMetadataAfterUpdateHandlerImpl,
    dependencies: [MetadataWriter]
});
