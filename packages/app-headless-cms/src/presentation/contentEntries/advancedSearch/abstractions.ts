import { createAbstraction } from "@webiny/feature/admin";
import type { FieldRaw } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";

export interface EntryAuthor {
    id: string;
    displayName: string;
}

export interface ICmsAdvancedSearchViewModel {
    // The users who can read the current model's entries, offered by the Author filter.
    authors: EntryAuthor[];
    // The fields the advanced search offers for the current model, the Author field included.
    fields: FieldRaw[];
}

export interface ICmsAdvancedSearchPresenter {
    vm: ICmsAdvancedSearchViewModel;
    loadAuthors(): Promise<void>;
    applyFilter(data: FilterDTO | null): void;
    clearFilter(): void;
}

export const CmsAdvancedSearchPresenter = createAbstraction<ICmsAdvancedSearchPresenter>(
    "CmsAdvancedSearchPresenter"
);

export namespace CmsAdvancedSearchPresenter {
    export type Interface = ICmsAdvancedSearchPresenter;
    export type ViewModel = ICmsAdvancedSearchViewModel;
}
