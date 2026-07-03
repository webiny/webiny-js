import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "~/types.js";

export interface ICloneContentModelPresenterViewModel {
    loading: boolean;
    saving: boolean;
    groups: { value: string; label: string }[];
    models: CmsModel[];
    form: IFormVM;
}

export interface ICloneContentModelPresenter {
    readonly vm: ICloneContentModelPresenterViewModel;
    init(sourceModel: CmsModel): void;
    save(): Promise<CmsModel | null>;
    reset(): void;
}

export const CloneContentModelPresenter = createAbstraction<ICloneContentModelPresenter>(
    "CmsCloneContentModel/Presenter"
);

export namespace CloneContentModelPresenter {
    export type Interface = ICloneContentModelPresenter;
    export type ViewModel = ICloneContentModelPresenterViewModel;
}
