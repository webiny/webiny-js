import { createFeature } from "@webiny/feature/admin";
import { DeleteFolderUseCase as UseCase } from "./abstractions.js";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase.js";
import { DeleteFolderRepository } from "./DeleteFolderRepository.js";
import { DeleteFolderGqlGateway } from "./DeleteFolderGqlGateway.js";

export const DeleteFolderFeature = createFeature({
    name: "DeleteFolder",
    register(container) {
        container.register(DeleteFolderUseCase);
        container.register(DeleteFolderRepository).inSingletonScope();
        container.register(DeleteFolderGqlGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
