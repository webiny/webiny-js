import { createFeature } from "@webiny/feature/api";
import { ListModelsUseCaseImplementation } from "./ListModelsUseCase.js";

export const ListModelsFeature = createFeature({
    name: "AiPowerUpsListModels",
    register(container) {
        container.register(ListModelsUseCaseImplementation);
    }
});
