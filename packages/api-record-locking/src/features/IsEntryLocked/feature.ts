import { createFeature } from "@webiny/feature/api";
import { IsEntryLockedUseCase } from "./IsEntryLockedUseCase.js";

export const IsEntryLockedFeature = createFeature({
    name: "IsEntryLocked",
    register(container) {
        container.register(IsEntryLockedUseCase);
    }
});
