import { createFeature } from "@webiny/feature/admin";
import { RecordLockingPresenter } from "./abstractions.js";
import { RecordLockingPresenterImplementation } from "./RecordLockingPresenter.js";
import { ContentEntryFormPresenterLockingDecorator } from "./ContentEntryFormPresenterDecorator.js";

export const RecordLockingPresenterFeature = createFeature({
    name: "RecordLocking/EntryLockingPresenter",
    register(container) {
        container.register(RecordLockingPresenterImplementation).inSingletonScope();
        container.registerDecorator(ContentEntryFormPresenterLockingDecorator);
    },
    resolve(container) {
        return {
            presenter: container.resolve(RecordLockingPresenter)
        };
    }
});
