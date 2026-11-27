import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface ISingletonEditorVm {
    entryId: string | null;
    loading: boolean;
    error: string | null;
    hasFields: boolean;
}

export interface ISingletonEditorPresenter {
    vm: ISingletonEditorVm;
    init(model: CmsModel, routeEntryId: string | undefined): Promise<void>;
    dispose(): void;
}

export const SingletonEditorPresenter = createAbstraction<ISingletonEditorPresenter>(
    "SingletonEditorPresenter"
);

export namespace SingletonEditorPresenter {
    export type Interface = ISingletonEditorPresenter;
    export type ViewModel = ISingletonEditorVm;
}
