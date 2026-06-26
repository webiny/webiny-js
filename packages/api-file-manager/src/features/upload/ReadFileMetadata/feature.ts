import { createFeature } from "@webiny/feature/api";
import { MetadataReader } from "./MetadataReader.js";

export const ReadFileMetadataFeature = createFeature({
    name: "FileManager/ReadFileMetadata",
    register(container) {
        container.register(MetadataReader);
    }
});
