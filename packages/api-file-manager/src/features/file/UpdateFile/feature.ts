import { createFeature } from "@webiny/feature/api";
import { UpdateFileRepository } from "./UpdateFileRepository.js";
import { UpdateFileUseCase } from "./UpdateFileUseCase.js";

export const UpdateFileFeature = createFeature({
    name: "FileManager/UpdateFile",
    register(container) {
        container.register(UpdateFileUseCase);
        container.register(UpdateFileRepository).inSingletonScope();
    }
});
