import { createFeature } from "@webiny/feature/api";
import { ExtractFrontmatterBeforeCreateHandler } from "./ExtractFrontmatterBeforeCreateHandler.js";

export const ExtractFrontmatterFeature = createFeature({
    name: "AiPowerUps/ExtractFrontmatter",
    register(container) {
        container.register(ExtractFrontmatterBeforeCreateHandler);
    }
});
