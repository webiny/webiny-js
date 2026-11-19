import { createAbstraction } from "@webiny/feature/admin";

export interface EntryAuthor {
    id: string;
    displayName: string;
}

export interface IListEntryAuthorsGateway {
    execute(): Promise<EntryAuthor[]>;
}

export const ListEntryAuthorsGateway =
    createAbstraction<IListEntryAuthorsGateway>("ListEntryAuthorsGateway");

export namespace ListEntryAuthorsGateway {
    export type Interface = IListEntryAuthorsGateway;
}

export interface IListEntryAuthorsUseCase {
    execute(): Promise<EntryAuthor[]>;
}

export const ListEntryAuthorsUseCase =
    createAbstraction<IListEntryAuthorsUseCase>("ListEntryAuthorsUseCase");

export namespace ListEntryAuthorsUseCase {
    export type Interface = IListEntryAuthorsUseCase;
}
