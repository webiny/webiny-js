import { createAbstraction } from "@webiny/feature/admin";

export interface CmsEntriesReader {
    id: string;
    displayName: string;
}

// Gateway

export interface IListUsersWhoCanReadEntriesGateway {
    execute(modelId: string): Promise<CmsEntriesReader[]>;
}

export const ListUsersWhoCanReadEntriesGateway =
    createAbstraction<IListUsersWhoCanReadEntriesGateway>("ListUsersWhoCanReadEntriesGateway");

export namespace ListUsersWhoCanReadEntriesGateway {
    export type Interface = IListUsersWhoCanReadEntriesGateway;
}

// UseCase

/**
 * Lists the users who can read the given model's entries, by ID and name. The entry list offers
 * them as authors to filter by.
 */
export interface IListUsersWhoCanReadEntriesUseCase {
    execute(modelId: string): Promise<CmsEntriesReader[]>;
}

export const ListUsersWhoCanReadEntriesUseCase =
    createAbstraction<IListUsersWhoCanReadEntriesUseCase>("ListUsersWhoCanReadEntriesUseCase");

export namespace ListUsersWhoCanReadEntriesUseCase {
    export type Interface = IListUsersWhoCanReadEntriesUseCase;
    export type Reader = CmsEntriesReader;
}
