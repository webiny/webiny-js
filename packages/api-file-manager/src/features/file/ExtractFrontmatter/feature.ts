import { createFeature } from "@webiny/feature/api";
import { ExtractFrontmatterBeforeCreateHandler } from "./ExtractFrontmatterBeforeCreateHandler.js";

export const ExtractFrontmatterFeature = createFeature({
    name: "FileManager/ExtractFrontmatter",
    register(container) {
        container.register(ExtractFrontmatterBeforeCreateHandler);
    }
});
