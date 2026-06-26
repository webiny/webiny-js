import { createAbstraction } from "@webiny/feature/admin";
import type { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { ContentEntryFormPresenter } from "~/presentation/contentEntries/form/abstractions.js";

export interface INewEntryPresenter {
    readonly form: ContentEntryFormPresenter.Interface;
    readonly folders: FolderTreePresenter.Interface;
    init(): void;
    dispose(): void;
}

export const NewEntryPresenter = createAbstraction<INewEntryPresenter>("NewEntryPresenter");

export namespace NewEntryPresenter {
    export type Interface = INewEntryPresenter;
}
