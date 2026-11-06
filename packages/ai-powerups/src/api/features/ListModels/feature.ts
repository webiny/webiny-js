import { createFeature } from "@webiny/feature/api";
import ListModelsUseCase from "./ListModelsUseCase.js";

export const ListModelsFeature = createFeature({
    name: "AiPowerUpsListModels",
    register(container) {
        container.register(ListModelsUseCase);
    }
});
