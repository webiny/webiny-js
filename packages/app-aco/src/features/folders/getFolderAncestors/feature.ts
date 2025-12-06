import { createFeature } from "@webiny/feature/admin";
import { GetFolderAncestorsUseCase as UseCase } from "./abstractions.js";
import { GetFolderAncestorsUseCase } from "./GetFolderAncestorsUseCase.js";
import { GetFolderAncestorsRepository } from "./GetFolderAncestorsRepository.js";

export const GetFolderAncestorsFeature = createFeature({
    name: "GetFolderAncestors",
    register(container) {
        container.register(GetFolderAncestorsUseCase);
        container.register(GetFolderAncestorsRepository).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
