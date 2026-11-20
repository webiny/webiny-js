import { createFeature } from "@webiny/feature/api";
import { ListGlobalComponentsRepository } from "./ListGlobalComponentsRepository.js";
import { ListGlobalComponentsUseCase } from "./ListGlobalComponentsUseCase.js";

export const ListGlobalComponentsFeature = createFeature({
    name: "WebsiteBuilder/ListGlobalComponents",
    register(container) {
        container.register(ListGlobalComponentsRepository).inSingletonScope();
        container.register(ListGlobalComponentsUseCase);
    }
});
