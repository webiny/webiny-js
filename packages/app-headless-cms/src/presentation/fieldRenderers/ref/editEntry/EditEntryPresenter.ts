import { ContentEntryFormPresenter } from "~/presentation/contentEntries/form/abstractions.js";
import { EditEntryPresenter as Abstraction } from "./abstractions.js";

class EditEntryPresenterImpl implements Abstraction.Interface {
    constructor(private formPresenter: ContentEntryFormPresenter.Interface) {}

    get form(): ContentEntryFormPresenter.Interface {
        return this.formPresenter;
    }

    init(entryId: string): void {
        this.formPresenter.loadRevision(entryId);
    }

    dispose(): void {
        this.formPresenter.reset();
    }
}

export const EditEntryPresenter = Abstraction.createImplementation({
    implementation: EditEntryPresenterImpl,
    dependencies: [ContentEntryFormPresenter]
});
