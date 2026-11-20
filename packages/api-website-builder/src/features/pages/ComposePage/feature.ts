import { createFeature } from "@webiny/feature/api";
import { ComposePageUseCase } from "./ComposePageUseCase.js";

export const ComposePageFeature = createFeature({
    name: "WebsiteBuilder/ComposePage",
    register(container) {
        container.register(ComposePageUseCase);
    }
});
