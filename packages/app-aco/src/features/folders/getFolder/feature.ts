import { createFeature } from "@webiny/feature/admin";
import { GetFolderUseCase as UseCase } from "./abstractions.js";
import { GetFolderUseCase } from "./GetFolderUseCase.js";
import { GetFolderRepository } from "./GetFolderRepository.js";
import { GetFolderGqlGateway } from "./GetFolderGqlGateway.js";

export const GetFolderFeature = createFeature({
    name: "GetFolder",
    register(container) {
        container.register(GetFolderUseCase);
        container.register(GetFolderRepository).inSingletonScope();
        container.register(GetFolderGqlGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
