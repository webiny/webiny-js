import { createFeature } from "@webiny/feature/api";
import { ComposeLayoutUseCase } from "./ComposeLayoutUseCase.js";

export const ComposeLayoutFeature = createFeature({
    name: "WebsiteBuilder/ComposeLayout",
    register(container) {
        container.register(ComposeLayoutUseCase);
    }
});
