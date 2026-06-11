import { createFeature } from "@webiny/feature/admin";
import { ListLockRecordsPresenter } from "./abstractions.js";
import { ListLockRecordsPresenterImplementation } from "./ListLockRecordsPresenter.js";

export const ListLockRecordsPresenterFeature = createFeature({
    name: "RecordLocking/ListLockRecordsPresenter",
    register(container) {
        container.register(ListLockRecordsPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ListLockRecordsPresenter)
        };
    }
});
