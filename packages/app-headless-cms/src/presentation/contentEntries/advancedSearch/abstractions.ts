import { createAbstraction } from "@webiny/feature/admin";

export interface EntryAuthor {
    id: string;
    displayName: string;
}

export interface ICmsAdvancedSearchViewModel {
    /** Admin users offered by the Author filter. Empty when the identity cannot list users. */
    authors: EntryAuthor[];
}

export interface ICmsAdvancedSearchPresenter {
    vm: ICmsAdvancedSearchViewModel;
    loadAuthors(): Promise<void>;
}

export const CmsAdvancedSearchPresenter = createAbstraction<ICmsAdvancedSearchPresenter>(
    "CmsAdvancedSearchPresenter"
);

export namespace CmsAdvancedSearchPresenter {
    export type Interface = ICmsAdvancedSearchPresenter;
    export type ViewModel = ICmsAdvancedSearchViewModel;
}
