import { createFeature } from "@webiny/feature/api";
import { DuplicateLayoutUseCase } from "./DuplicateLayoutUseCase.js";

export const DuplicateLayoutFeature = createFeature({
    name: "WebsiteBuilder/DuplicateLayout",
    register(container) {
        container.register(DuplicateLayoutUseCase);
    }
});
