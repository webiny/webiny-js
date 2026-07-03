import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { IDropdownOption } from "../abstractions.js";

export interface IRefMultiAutocompleteInitConfig {
    modelIds: string[];
    values?: CmsReferenceValue[];
}

export interface IRefMultiAutocompleteViewModel {
    loading: boolean;
    options: IDropdownOption[];
    values: string[];
    ready: boolean;
}

export interface IRefMultiAutocompletePresenter {
    readonly vm: IRefMultiAutocompleteViewModel;
    init(config: IRefMultiAutocompleteInitConfig): Promise<void>;
    search(query: string): Promise<void>;
    select(entryIds: string[]): CmsReferenceValue[];
    clear(): void;
    dispose(): void;
}

export const RefMultiAutocompletePresenter = createAbstraction<IRefMultiAutocompletePresenter>(
    "RefMultiAutocompletePresenter"
);

export namespace RefMultiAutocompletePresenter {
    export type Interface = IRefMultiAutocompletePresenter;
}
