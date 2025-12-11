import { createFeature } from "@webiny/feature/admin";
import { CreateFolderUseCase as UseCase } from "./abstractions.js";
import { CreateFolderUseCase } from "./CreateFolderUseCase.js";
import { CreateFolderRepository } from "./CreateFolderRepository.js";
import { CreateFolderGqlGateway } from "./CreateFolderGqlGateway.js";

export const CreateFolderFeature = createFeature({
    name: "CreateFolder",
    register(container) {
        container.register(CreateFolderUseCase);
        container.register(CreateFolderRepository).inSingletonScope();
        container.register(CreateFolderGqlGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
