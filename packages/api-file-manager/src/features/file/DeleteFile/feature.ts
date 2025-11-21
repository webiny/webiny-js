import { createFeature } from "@webiny/feature/api";
import { DeleteFileRepository } from "./DeleteFileRepository.js";
import { DeleteFileUseCase } from "./DeleteFileUseCase.js";

export const DeleteFileFeature = createFeature({
    name: "FileManager/DeleteFile",
    register(container) {
        container.register(DeleteFileUseCase);
        container.register(DeleteFileRepository).inSingletonScope();
    }
});
