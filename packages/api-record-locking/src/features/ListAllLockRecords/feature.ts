import { createFeature } from "@webiny/feature/api";
import { ListAllLockRecordsUseCase } from "./ListAllLockRecordsUseCase.js";
import { ListAllLockRecordsRepository } from "./ListAllLockRecordsRepository.js";

export const ListAllLockRecordsFeature = createFeature({
    name: "ListAllLockRecords",
    register(container) {
        container.register(ListAllLockRecordsUseCase);
        container.register(ListAllLockRecordsRepository).inSingletonScope();
    }
});
