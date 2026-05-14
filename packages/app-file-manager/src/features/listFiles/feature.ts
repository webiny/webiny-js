import { createFeature } from "@webiny/feature/admin";
import { ListFilesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListFilesUseCase } from "./ListFilesUseCase.js";
import { ListFilesRepository } from "./ListFilesRepository.js";
import { ListFilesGateway } from "./ListFilesGateway.js";

export const ListFilesFeature = createFeature({
    name: "FileManager/ListFiles",
    register(container) {
        container.register(ListFilesUseCase);
        container.register(ListFilesRepository).inSingletonScope();
        container.register(ListFilesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
