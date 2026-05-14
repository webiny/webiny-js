import { createFeature } from "@webiny/feature/admin";
import { UpdateFileUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateFileUseCase } from "./UpdateFileUseCase.js";
import { UpdateFileRepository } from "./UpdateFileRepository.js";
import { UpdateFileGateway } from "./UpdateFileGateway.js";

export const UpdateFileFeature = createFeature({
    name: "FileManager/UpdateFile",
    register(container) {
        container.register(UpdateFileUseCase);
        container.register(UpdateFileRepository).inSingletonScope();
        container.register(UpdateFileGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
