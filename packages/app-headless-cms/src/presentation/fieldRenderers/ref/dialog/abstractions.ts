import { createAbstraction } from "@webiny/feature/admin";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

export interface IRefDialogPresenterInitConfig {
    modelId: string;
    initialValues?: CmsReferenceValue[];
    multiple: boolean;
}

export interface IRefDialogViewModel {
    selectedValues: CmsReferenceValue[];
    multiple: boolean;
}

export interface IRefDialogPresenter {
    readonly list: IListPresenter<CmsReferenceEntry>;
    readonly vm: IRefDialogViewModel;
    init(config: IRefDialogPresenterInitConfig): Promise<void>;
    toggleEntry(ref: CmsReferenceValue): void;
    save(): CmsReferenceValue[];
    dispose(): void;
}

export const RefDialogPresenter = createAbstraction<IRefDialogPresenter>("RefDialogPresenter");

export namespace RefDialogPresenter {
    export type Interface = IRefDialogPresenter;
    export type InitConfig = IRefDialogPresenterInitConfig;
    export type ViewModel = IRefDialogViewModel;
}
