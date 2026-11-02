import { createFeature } from "@webiny/feature/admin";
import { FolderExistsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderExistsUseCase } from "./FolderExistsUseCase.js";

export const FolderExistsFeature = createFeature({
    name: "Workflows/FolderExists",
    register(container) {
        container.register(FolderExistsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
