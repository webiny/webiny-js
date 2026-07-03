import { createFeature } from "@webiny/feature/api";
import { MetadataWriter } from "./MetadataWriter.js";
import { WriteMetadataAfterCreateHandler } from "./WriteMetadataAfterCreateHandler.js";
import { WriteMetadataAfterBatchCreateHandler } from "./WriteMetadataAfterBatchCreateHandler.js";

export const WriteFileMetadataFeature = createFeature({
    name: "FileManager/WriteFileMetadata",
    register(container) {
        container.register(MetadataWriter);
        container.register(WriteMetadataAfterCreateHandler);
        container.register(WriteMetadataAfterBatchCreateHandler);
    }
});
