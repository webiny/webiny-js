import type { IManageMutationBaseEntry } from "~tests/testHelpers/types.js";

export interface ICategoryInputValues {
    title: string;
    slug?: string;
    separator?: string;
}

export interface ICategoryInput extends IManageMutationBaseEntry<ICategoryInputValues>{

}

export interface ICategoryResponseValues {
    title: string;
    slug: string;
    separator: string | null | undefined;
}
