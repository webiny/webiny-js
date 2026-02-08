import { createFeature } from "@webiny/feature/api";
import { ExtractMetadataHandler } from "./ExtractMetadataHandler.js";
import { ExtractMetadataTaskDefinition } from "./ExtractMetadataTask.js";

export const ExtractMetadataFeature = createFeature({
    name: "FileManagerS3/ExtractMetadata",
    register(container) {
        container.register(ExtractMetadataHandler);
        container.register(ExtractMetadataTaskDefinition);
    }
});
