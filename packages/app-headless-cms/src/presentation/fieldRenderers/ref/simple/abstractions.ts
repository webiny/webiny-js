import { createAbstraction } from "@webiny/feature/admin";

export interface IRefSimplePresenterInitConfig {
    modelIds: string[];
}

export interface IRefSimpleEntry {
    id: string;
    entryId: string;
    title: string;
    modelId: string;
}

export interface IRefSimpleViewModel {
    loading: boolean;
    entries: IRefSimpleEntry[];
}

export interface IRefSimplePresenter {
    readonly vm: IRefSimpleViewModel;
    init(config: IRefSimplePresenterInitConfig): Promise<void>;
    dispose(): void;
}

export const RefSimplePresenter = createAbstraction<IRefSimplePresenter>("RefSimplePresenter");

export namespace RefSimplePresenter {
    export type Interface = IRefSimplePresenter;
    export type InitConfig = IRefSimplePresenterInitConfig;
    export type ViewModel = IRefSimpleViewModel;
}
