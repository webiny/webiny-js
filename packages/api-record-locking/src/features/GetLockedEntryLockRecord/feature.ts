import { createFeature } from "@webiny/feature/api";
import { GetLockedEntryLockRecordUseCase } from "./GetLockedEntryLockRecordUseCase.js";

export const GetLockedEntryLockRecordFeature = createFeature({
    name: "GetLockedEntryLockRecord",
    register(container) {
        container.register(GetLockedEntryLockRecordUseCase);
    }
});
