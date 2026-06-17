import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { ContentEntryFormPresenter } from "~/presentation/contentEntries/form/abstractions.js";
import { NewEntryPresenter as Abstraction } from "./abstractions.js";

class NewEntryPresenterImpl implements Abstraction.Interface {
    private _disposeOnFolderChange: (() => void) | null = null;

    constructor(
        private _formPresenter: ContentEntryFormPresenter.Interface,
        private _foldersPresenter: FolderTreePresenter.Interface
    ) {}

    get form(): ContentEntryFormPresenter.Interface {
        return this._formPresenter;
    }

    get folders(): FolderTreePresenter.Interface {
        return this._foldersPresenter;
    }

    init(): void {
        this._formPresenter.newEntry();

        this._disposeOnFolderChange = this._foldersPresenter.onFolderChange(folderId => {
            this._formPresenter.setFolderId(folderId);
        });
    }

    dispose(): void {
        if (this._disposeOnFolderChange) {
            this._disposeOnFolderChange();
            this._disposeOnFolderChange = null;
        }
        this._formPresenter.reset();
    }
}

export const NewEntryPresenterImplementation = Abstraction.createImplementation({
    implementation: NewEntryPresenterImpl,
    dependencies: [ContentEntryFormPresenter, FolderTreePresenter]
});
