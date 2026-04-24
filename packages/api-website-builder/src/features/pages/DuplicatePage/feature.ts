import { createFeature } from "@webiny/feature/api";
import { DuplicatePageRepository } from "./DuplicatePageRepository.js";
import { DuplicatePageUseCase } from "./DuplicatePageUseCase.js";

export const DuplicatePageFeature = createFeature({
    name: "WebsiteBuilder/DuplicatePage",
    register(container) {
        container.register(DuplicatePageRepository).inSingletonScope();
        container.register(DuplicatePageUseCase);
    }
});
