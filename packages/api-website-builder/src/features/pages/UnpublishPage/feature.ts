import { createFeature } from "@webiny/feature/api";
import { UnpublishPageRepository } from "./UnpublishPageRepository.js";
import { UnpublishPageUseCase } from "./UnpublishPageUseCase.js";

export const UnpublishPageFeature = createFeature({
    name: "WebsiteBuilder/UnpublishPage",
    register(container) {
        container.register(UnpublishPageRepository).inSingletonScope();
        container.register(UnpublishPageUseCase);
    }
});
