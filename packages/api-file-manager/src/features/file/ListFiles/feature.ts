import { createFeature } from "@webiny/feature/api";
import { ListFilesRepository } from "./ListFilesRepository.js";
import { ListFilesUseCase } from "./ListFilesUseCase.js";

export const ListFilesFeature = createFeature({
    name: "FileManager/ListFiles",
    register(container) {
        container.register(ListFilesUseCase);
        container.register(ListFilesRepository).inSingletonScope();
    }
});
