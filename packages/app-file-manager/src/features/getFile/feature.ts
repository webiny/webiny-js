import { createFeature } from "@webiny/feature/admin";
import { GetFileUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetFileUseCase } from "./GetFileUseCase.js";
import { GetFileRepository } from "./GetFileRepository.js";
import { GetFileGateway } from "./GetFileGateway.js";

export const GetFileFeature = createFeature({
    name: "FileManager/GetFile",
    register(container) {
        container.register(GetFileUseCase);
        container.register(GetFileRepository).inSingletonScope();
        container.register(GetFileGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
