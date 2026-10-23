import { createAbstraction } from "@webiny/feature/api";

/** An admin user of the current tenant, as the caller listed it (`AdminUser` fits). */
export interface CandidateUser {
    id: string;
    displayName: string;
}

export interface ICandidateReadAccess {
    /**
     * Runs `check` as the admin user `user` of the current tenant, with authorization enabled
     * (also inside `withoutAuthorization`), and returns its answer; `false` when anything throws
     * (fail closed). The caller vouches that `user` is an admin user of the current tenant: it
     * passes a user it listed with `ListUsersUseCase` (R68), so nothing is looked up here. Read CMS
     * models before calling, as the current identity (A19).
     */
    canUserRead(user: CandidateUser, check: () => Promise<boolean>): Promise<boolean>;
}

/**
 * A building block for the target adapters' `ReviewTargetReadAccess.filterReadableUsers` (R48,
 * R67): one boolean read check for a candidate, nothing else. Not a general "run as" primitive and
 * not called by the api-workflows use cases (D132).
 */
export const CandidateReadAccess = createAbstraction<ICandidateReadAccess>("CandidateReadAccess");

export namespace CandidateReadAccess {
    export type Interface = ICandidateReadAccess;
    export type User = CandidateUser;
}
