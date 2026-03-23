import { createFeature } from "@webiny/feature/api";
import { RestorePageRepository } from "./RestorePageRepository.js";
import { RestorePageUseCase } from "./RestorePageUseCase.js";

export const RestorePageFeature = createFeature({
    name: "WebsiteBuilder/RestorePage",
    register(container) {
        container.register(RestorePageRepository).inSingletonScope();
        container.register(RestorePageUseCase);
    }
});
