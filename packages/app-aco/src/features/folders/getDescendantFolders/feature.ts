import { createFeature } from "@webiny/feature/admin";
import { GetDescendantFoldersUseCase as UseCase } from "./abstractions.js";
import { GetDescendantFoldersUseCase } from "./GetDescendantFoldersUseCase.js";
import { GetDescendantFoldersRepository } from "./GetDescendantFoldersRepository.js";

export const GetDescendantFoldersFeature = createFeature({
    name: "GetDescendantFolders",
    register(container) {
        container.register(GetDescendantFoldersUseCase);
        container.register(GetDescendantFoldersRepository).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
