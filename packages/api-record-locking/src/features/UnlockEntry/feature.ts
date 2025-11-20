import { createFeature } from "@webiny/feature/api";
import { UnlockEntryUseCase } from "./UnlockEntryUseCase.js";
import { UnlockEntryRepository } from "./UnlockEntryRepository.js";
import { UnlockEntryEventsDecorator } from "./UnlockEntryEventsDecorator.js";

export const UnlockEntryFeature = createFeature({
    name: "UnlockEntry",
    register(container) {
        container.register(UnlockEntryUseCase);
        container.register(UnlockEntryRepository).inSingletonScope();
        container.registerDecorator(UnlockEntryEventsDecorator);
    }
});
