import { createFeature } from "@webiny/feature/api";
import { CreateFileRepository } from "./CreateFileRepository.js";
import { CreateFileUseCase } from "./CreateFileUseCase.js";

export const CreateFileFeature = createFeature({
    name: "FileManager.CreateFile",
    register(container) {
        container.register(CreateFileUseCase);
        container.register(CreateFileRepository).inSingletonScope();
    }
});
