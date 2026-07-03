import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { IDropdownOption } from "../abstractions.js";

export interface IRefSingleAutocompleteInitConfig {
    modelIds: string[];
    value?: CmsReferenceValue | null;
}

export interface IRefSingleAutocompleteViewModel {
    loading: boolean;
    options: IDropdownOption[];
    value: string | undefined;
    canReset: boolean;
}

export interface IRefSingleAutocompletePresenter {
    readonly vm: IRefSingleAutocompleteViewModel;
    init(config: IRefSingleAutocompleteInitConfig): Promise<void>;
    search(query: string): Promise<void>;
    select(entryId: string): CmsReferenceValue | null;
    clear(): void;
    dispose(): void;
}

export const RefSingleAutocompletePresenter = createAbstraction<IRefSingleAutocompletePresenter>(
    "RefSingleAutocompletePresenter"
);

export namespace RefSingleAutocompletePresenter {
    export type Interface = IRefSingleAutocompletePresenter;
}
