import { createFeature } from "@webiny/feature/admin";
import { RecordLockingPresenter } from "./abstractions.js";
import { RecordLockingPresenterImplementation } from "./RecordLockingPresenter.js";
import { ContentEntryFormPresenterLockingDecorator } from "./ContentEntryFormPresenterDecorator.js";
import { SingleEntryPresenterLockingDecorator } from "./SingleEntryPresenterDecorator.js";

export const RecordLockingPresenterFeature = createFeature({
    name: "RecordLocking/EntryLockingPresenter",
    register(container) {
        container.register(RecordLockingPresenterImplementation).inSingletonScope();
        container.registerDecorator(ContentEntryFormPresenterLockingDecorator);
        container.registerDecorator(SingleEntryPresenterLockingDecorator);
    },
    resolve(container) {
        return {
            presenter: container.resolve(RecordLockingPresenter)
        };
    }
});
