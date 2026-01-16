export interface ICategoryInputValues {
    title: string;
    slug?: string;
    separator?: string;
}

export interface ICategoryInput {
    id?: string;
    values: ICategoryInputValues;
}

export interface ICategoryResponseValues {
    title: string;
    slug: string;
    separator: string | null | undefined;
}
