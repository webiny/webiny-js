import { createFeature } from "@webiny/feature/admin";
import { ListLockRecordsUseCase as UseCase } from "./abstractions.js";
import { ListLockRecordsUseCase } from "./ListLockRecordsUseCase.js";
import { ListLockRecordsGateway } from "./ListLockRecordsGateway.js";

export const ListLockRecordsFeature = createFeature({
    name: "RecordLocking/ListLockRecords",
    register(container) {
        container.register(ListLockRecordsUseCase);
        container.register(ListLockRecordsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
