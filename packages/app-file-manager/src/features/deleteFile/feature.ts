import { createFeature } from "@webiny/feature/admin";
import { DeleteFileUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteFileUseCase } from "./DeleteFileUseCase.js";
import { DeleteFileRepository } from "./DeleteFileRepository.js";
import { DeleteFileGateway } from "./DeleteFileGateway.js";

export const DeleteFileFeature = createFeature({
    name: "FileManager/DeleteFile",
    register(container) {
        container.register(DeleteFileUseCase);
        container.register(DeleteFileRepository).inSingletonScope();
        container.register(DeleteFileGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
