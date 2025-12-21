import { createFeature } from "@webiny/feature/api";
import { ListLockRecordsUseCase } from "./ListLockRecordsUseCase.js";
import { ListLockRecordsRepository } from "./ListLockRecordsRepository.js";

export const ListLockRecordsFeature = createFeature({
    name: "ListLockRecords",
    register(container) {
        container.register(ListLockRecordsUseCase);
        container.register(ListLockRecordsRepository).inSingletonScope();
    }
});
