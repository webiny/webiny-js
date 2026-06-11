import { createFeature } from "@webiny/feature/admin";
import { ListLockRecordsPresenter } from "./abstractions.js";
import { ListLockRecordsPresenterImplementation } from "./ListLockRecordsPresenter.js";
import { ContentEntriesPresenterLockingDecorator } from "./ContentEntriesPresenterDecorator.js";

export const ListLockRecordsPresenterFeature = createFeature({
    name: "RecordLocking/ListLockRecordsPresenter",
    register(container) {
        container.register(ListLockRecordsPresenterImplementation).inSingletonScope();
        container.registerDecorator(ContentEntriesPresenterLockingDecorator);
    },
    resolve(container) {
        return {
            presenter: container.resolve(ListLockRecordsPresenter)
        };
    }
});
