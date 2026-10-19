import { createAbstraction } from "@webiny/feature/admin";

// The part of an admin model the content type list needs.
export interface ListedModel {
    modelId: string;
    name: string;
    tags?: string[];
    isBeingDeleted?: boolean;
}

export interface ContentType {
    modelId: string;
    name: string;
}

export interface CmsContentTypeOption {
    label: string;
    value: string;
}

export interface ICmsContentReviewsViewModel {
    loading: boolean;
    namespaces: string[];
    options: CmsContentTypeOption[];
}

export interface ICmsContentReviewsPresenter {
    readonly vm: ICmsContentReviewsViewModel;
    init(): Promise<void>;
    dispose(): void;
}

export const CmsContentReviewsPresenter = createAbstraction<ICmsContentReviewsPresenter>(
    "Cms/Workflows/ContentReviewsPresenter"
);

export namespace CmsContentReviewsPresenter {
    export type Interface = ICmsContentReviewsPresenter;
    export type ViewModel = ICmsContentReviewsViewModel;
}
