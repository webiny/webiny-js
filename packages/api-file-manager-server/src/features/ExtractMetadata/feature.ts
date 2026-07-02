import { createFeature } from "@webiny/feature/api";
import { ExtractMetadataHandler } from "./ExtractMetadataHandler.js";
import { ExtractMetadataTaskDefinition } from "./ExtractMetadataTask.js";

export const ExtractMetadataFeature = createFeature({
    name: "FileManagerServer/ExtractMetadata",
    register(container) {
        container.register(ExtractMetadataHandler);
        container.register(ExtractMetadataTaskDefinition);
    }
});
