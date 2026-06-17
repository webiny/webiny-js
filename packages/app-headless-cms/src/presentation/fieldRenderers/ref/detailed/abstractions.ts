import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

export interface IRefDetailedPresenterInitConfig {
    modelIds: string[];
    multiSelect: boolean;
}

export interface IRefDetailedViewModel {
    loading: boolean;
    entries: CmsReferenceEntry[];
    models: CmsModel[];
    multiSelect: boolean;
}

export interface IRefDetailedPresenter {
    readonly vm: IRefDetailedViewModel;
    init(config: IRefDetailedPresenterInitConfig): Promise<void>;
    resolveValues(values: CmsReferenceValue[]): Promise<void>;
    loadMore(): void;
    dispose(): void;
}

export const RefDetailedPresenter =
    createAbstraction<IRefDetailedPresenter>("RefDetailedPresenter");

export namespace RefDetailedPresenter {
    export type Interface = IRefDetailedPresenter;
    export type InitConfig = IRefDetailedPresenterInitConfig;
    export type ViewModel = IRefDetailedViewModel;
}
