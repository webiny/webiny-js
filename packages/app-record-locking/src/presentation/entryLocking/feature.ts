import { createFeature } from "@webiny/feature/admin";
import { RecordLockingPresenter as Abstraction } from "./abstractions.js";
import { RecordLockingPresenter } from "./RecordLockingPresenter.js";
import { ContentEntryFormPresenterLockingDecorator } from "./ContentEntryFormPresenterDecorator.js";
import { SingleEntryPresenterLockingDecorator } from "./SingleEntryPresenterDecorator.js";

export const RecordLockingPresenterFeature = createFeature({
    name: "RecordLocking/EntryLockingPresenter",
    register(container) {
        container.register(RecordLockingPresenter).inSingletonScope();
        container.registerDecorator(ContentEntryFormPresenterLockingDecorator);
        container.registerDecorator(SingleEntryPresenterLockingDecorator);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
