import { createFeature } from "@webiny/feature/api";
import { GetFileRepository } from "./GetFileRepository.js";
import { GetFileUseCase } from "./GetFileUseCase.js";

export const GetFileFeature = createFeature({
    name: "FileManager.GetFile",
    register(container) {
        container.register(GetFileUseCase);
        container.register(GetFileRepository).inSingletonScope();
    }
});
