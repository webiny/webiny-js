import { createFeature } from "@webiny/feature/api";
import { UpdateEntryLockUseCase } from "./UpdateEntryLockUseCase.js";
import { UpdateEntryLockRepository } from "./UpdateEntryLockRepository.js";

export const UpdateEntryLockFeature = createFeature({
    name: "UpdateEntryLock",
    register(container) {
        container.register(UpdateEntryLockUseCase);
        container.register(UpdateEntryLockRepository).inSingletonScope();
    }
});
