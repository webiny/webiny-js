import { createFeature } from "@webiny/feature/api";
import { GetLockRecordUseCase } from "./GetLockRecordUseCase.js";
import { GetLockRecordRepository } from "./GetLockRecordRepository.js";

export const GetLockRecordFeature = createFeature({
    name: "GetLockRecord",
    register(container) {
        container.register(GetLockRecordUseCase);
        container.register(GetLockRecordRepository).inSingletonScope();
    }
});
