import { FileAfterCreateEventHandler } from "~/features/file/CreateFile/events.js";
import { MetadataWriter } from "./abstractions.js";

class WriteMetadataAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    private readonly metadataWriter: MetadataWriter.Interface;

    public constructor(metadataWriter: MetadataWriter.Interface) {
        this.metadataWriter = metadataWriter;
    }

    public async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        await this.metadataWriter.write([file]);
    }
}

export const WriteMetadataAfterCreateHandler = FileAfterCreateEventHandler.createImplementation({
    implementation: WriteMetadataAfterCreateHandlerImpl,
    dependencies: [MetadataWriter]
});
