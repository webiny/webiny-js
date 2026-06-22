import { createFeature } from "@webiny/feature/api";
import { WriteMetadataAfterCreateHandler } from "./WriteMetadataAfterCreateHandler.js";
import { WriteMetadataAfterBatchCreateHandler } from "./WriteMetadataAfterBatchCreateHandler.js";

export const WriteFileMetadataFeature = createFeature({
    name: "FileManager/WriteFileMetadata",
    register(container) {
        container.register(WriteMetadataAfterCreateHandler);
        container.register(WriteMetadataAfterBatchCreateHandler);
    }
});
