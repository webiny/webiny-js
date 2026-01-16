export interface ICategoryInput {
    id?: string;
    values: {
        title: string;
        slug: string;
    };
}

export interface ICategoryResponse {
    id: string;
    entryId: string;
    values: {
        title: string;
        slug: string;
    };
}
