import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { ContentEntryFormPresenter } from "~/presentation/contentEntries/form/abstractions.js";
import { NewEntryPresenter as Abstraction } from "./abstractions.js";

class NewEntryPresenterImpl implements Abstraction.Interface {
    private disposeOnFolderChange: (() => void) | null = null;

    constructor(
        private formPresenter: ContentEntryFormPresenter.Interface,
        private foldersPresenter: FolderTreePresenter.Interface
    ) {}

    get form(): ContentEntryFormPresenter.Interface {
        return this.formPresenter;
    }

    get folders(): FolderTreePresenter.Interface {
        return this.foldersPresenter;
    }

    init(): void {
        this.formPresenter.newEntry();

        this.disposeOnFolderChange = this.foldersPresenter.onFolderChange(folderId => {
            this.formPresenter.setFolderId(folderId);
        });
    }

    dispose(): void {
        if (this.disposeOnFolderChange) {
            this.disposeOnFolderChange();
            this.disposeOnFolderChange = null;
        }
        this.formPresenter.reset();
    }
}

export const NewEntryPresenter = Abstraction.createImplementation({
    implementation: NewEntryPresenterImpl,
    dependencies: [ContentEntryFormPresenter, FolderTreePresenter]
});
