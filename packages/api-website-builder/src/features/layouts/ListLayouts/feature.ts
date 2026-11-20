import { createFeature } from "@webiny/feature/api";
import { ListLayoutsRepository } from "./ListLayoutsRepository.js";
import { ListLayoutsUseCase } from "./ListLayoutsUseCase.js";

export const ListLayoutsFeature = createFeature({
    name: "WebsiteBuilder/ListLayouts",
    register(container) {
        container.register(ListLayoutsRepository).inSingletonScope();
        container.register(ListLayoutsUseCase);
    }
});
