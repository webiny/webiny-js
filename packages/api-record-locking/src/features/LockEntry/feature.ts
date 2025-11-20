import { createFeature } from "@webiny/feature/api";
import { LockEntryUseCase } from "./LockEntryUseCase.js";
import { LockEntryRepository } from "./LockEntryRepository.js";

export const LockEntryFeature = createFeature({
    name: "LockEntry",
    register(container) {
        container.register(LockEntryUseCase);
        container.register(LockEntryRepository).inSingletonScope();
    }
});
