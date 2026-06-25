import { createFeature } from "@webiny/feature/admin";
import { ExportModelsUseCase as UseCase } from "./abstractions.js";
import { ExportModelsUseCase } from "./ExportModelsUseCase.js";
import { ExportModelsGateway } from "./ExportModelsGateway.js";

export const ExportModelsFeature = createFeature({
    name: "CmsModel/ExportModels",
    register(container) {
        container.register(ExportModelsUseCase);
        container.register(ExportModelsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
