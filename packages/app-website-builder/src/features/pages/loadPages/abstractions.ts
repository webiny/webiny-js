import { createAbstraction } from "@webiny/feature/admin";

export interface IListPagesGraphQLFieldSelection {
    getSelection(): string[];
}

export const ListPagesGraphQLFieldSelection = createAbstraction<IListPagesGraphQLFieldSelection>(
    "ListPagesGraphQLFieldSelection"
);

export namespace ListPagesGraphQLFieldSelection {
    export type Interface = IListPagesGraphQLFieldSelection;
}
