import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

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

export interface IDropdownOption {
    label: string;
    value: string;
}

export interface IRefAutocompleteViewModel {
    loading: boolean;
    dropdownOptions: IDropdownOption[];
    singleValue: string | undefined;
    multipleValues: string[];
    canShowMultipleValues: boolean;
    canReset: boolean;
}

export interface IRefAutocompletePresenter {
    readonly vm: IRefAutocompleteViewModel;
    init(config: IRefAutocompletePresenterInitConfig): Promise<void>;
    search(query: string): Promise<void>;
    selectValue(entryId: string): CmsReferenceValue | null;
    selectValues(entryIds: string[]): CmsReferenceValue[];
    clearValue(): void;
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
