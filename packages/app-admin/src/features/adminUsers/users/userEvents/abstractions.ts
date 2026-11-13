import { createAbstraction } from "@webiny/feature/admin";

export interface IUsersRevision {
    /** Changes whenever a user is created, updated or deleted. */
    readonly list: number;
    /** Changes whenever the given user is updated. */
    user(id: string): number;
    listChanged(): void;
    userChanged(id: string): void;
}

/**
 * Tells the Users view when what it loaded is out of date. The view keeps the users list and the
 * open user in component state rather than in a shared cache, so it watches these numbers and reads
 * again when one moves.
 */
export const UsersRevision = createAbstraction<IUsersRevision>("AdminUsers/UsersRevision");

export namespace UsersRevision {
    export type Interface = IUsersRevision;
}
