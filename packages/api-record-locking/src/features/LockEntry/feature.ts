import { createFeature } from "@webiny/feature/api";
import { LockEntryUseCase } from "./LockEntryUseCase.js";
import { LockEntryRepository } from "./LockEntryRepository.js";
import { LockEntryEventsDecorator } from "./LockEntryEventsDecorator.js";

export const LockEntryFeature = createFeature({
    name: "LockEntry",
    register(container) {
        container.register(LockEntryUseCase);
        container.register(LockEntryRepository).inSingletonScope();
        container.registerDecorator(LockEntryEventsDecorator);
    }
});
