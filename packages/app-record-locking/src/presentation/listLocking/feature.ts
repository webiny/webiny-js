import { createFeature } from "@webiny/feature/admin";
import { ListLockRecordsPresenter as Abstraction } from "./abstractions.js";
import { ListLockRecordsPresenter } from "./ListLockRecordsPresenter.js";
import { ContentEntriesPresenterLockingDecorator } from "./ContentEntriesPresenterDecorator.js";

export const ListLockRecordsPresenterFeature = createFeature({
    name: "RecordLocking/ListLockRecordsPresenter",
    register(container) {
        container.register(ListLockRecordsPresenter).inSingletonScope();
        container.registerDecorator(ContentEntriesPresenterLockingDecorator);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
