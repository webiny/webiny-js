import { createAbstraction } from "@webiny/feature/admin";

export interface IGetPageGraphQLFieldSelection {
    getSelection(): string[];
}

export const GetPageGraphQLFieldSelection = createAbstraction<IGetPageGraphQLFieldSelection>(
    "GetPageGraphQLFieldSelection"
);

export namespace GetPageGraphQLFieldSelection {
    export type Interface = IGetPageGraphQLFieldSelection;
}
