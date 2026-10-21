import { createFeature } from "@webiny/feature/admin";
import { SaveGlobalComponentUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SaveGlobalComponentUseCase } from "./SaveGlobalComponentUseCase.js";
import { SaveGlobalComponentRepository } from "./SaveGlobalComponentRepository.js";
import { SaveGlobalComponentGateway } from "./SaveGlobalComponentGateway.js";

export const SaveGlobalComponentFeature = createFeature({
    name: "WebsiteBuilder/SaveGlobalComponent",
    register(container) {
        container.register(SaveGlobalComponentUseCase);
        container.register(SaveGlobalComponentRepository).inSingletonScope();
        container.register(SaveGlobalComponentGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
