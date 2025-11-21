import { createFeature } from "@webiny/feature/api";
import { CreateFilesInBatchRepository } from "./CreateFilesInBatchRepository.js";
import { CreateFilesInBatchUseCase } from "./CreateFilesInBatchUseCase.js";

export const CreateFilesInBatchFeature = createFeature({
    name: "FileManager/CreateFilesInBatch",
    register(container) {
        container.register(CreateFilesInBatchUseCase);
        container.register(CreateFilesInBatchRepository).inSingletonScope();
    }
});
