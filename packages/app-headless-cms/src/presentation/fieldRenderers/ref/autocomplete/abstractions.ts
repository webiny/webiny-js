import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

export interface IRefAutocompletePresenterInitConfig {
    modelIds: string[];
}

export interface IRefEntryOption {
    id: string;
    entryId: string;
    modelId: string;
    modelName: string;
    name: string;
    status: string;
    published: boolean;
}

export interface IRefAutocompleteViewModel {
    loading: boolean;
    options: IRefEntryOption[];
    resolvedValue: IRefEntryOption | null;
    resolvedValues: IRefEntryOption[];
}

export interface IRefAutocompletePresenter {
    readonly vm: IRefAutocompleteViewModel;
    init(config: IRefAutocompletePresenterInitConfig): Promise<void>;
    search(query: string): Promise<void>;
    resolveValue(value: CmsReferenceValue | null): Promise<void>;
    resolveValues(values: CmsReferenceValue[]): Promise<void>;
    dispose(): void;
}

export const RefAutocompletePresenter = createAbstraction<IRefAutocompletePresenter>(
    "RefAutocompletePresenter"
);

export namespace RefAutocompletePresenter {
    export type Interface = IRefAutocompletePresenter;
    export type InitConfig = IRefAutocompletePresenterInitConfig;
    export type ViewModel = IRefAutocompleteViewModel;
    export type EntryOption = IRefEntryOption;
}
