import { createAbstraction } from "@webiny/feature/admin";
import type { ContentEntryFormPresenter } from "~/presentation/contentEntries/form/abstractions.js";

export interface IEditEntryPresenter {
    readonly form: ContentEntryFormPresenter.Interface;
    init(entryId: string): void;
    dispose(): void;
}

export const EditEntryPresenter = createAbstraction<IEditEntryPresenter>("EditEntryPresenter");

export namespace EditEntryPresenter {
    export type Interface = IEditEntryPresenter;
}
