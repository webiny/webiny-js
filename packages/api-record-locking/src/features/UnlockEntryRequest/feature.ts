import { createFeature } from "@webiny/feature/api";
import { UnlockEntryRequestUseCase } from "./UnlockEntryRequestUseCase.js";
import { UnlockEntryRequestRepository } from "./UnlockEntryRequestRepository.js";
import { UnlockEntryRequestEventsDecorator } from "./UnlockEntryRequestEventsDecorator.js";

export const UnlockEntryRequestFeature = createFeature({
    name: "UnlockEntryRequest",
    register(container) {
        container.register(UnlockEntryRequestUseCase);
        container.register(UnlockEntryRequestRepository).inSingletonScope();
        container.registerDecorator(UnlockEntryRequestEventsDecorator);
    }
});
