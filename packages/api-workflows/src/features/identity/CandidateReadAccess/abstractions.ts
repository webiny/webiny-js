import { createAbstraction } from "@webiny/feature/api";

export interface ICandidateReadAccess {
    /**
     * Runs `check` as the admin user `userId` of the current tenant, with authorization enabled
     * (also inside `withoutAuthorization`), and returns its answer. Returns `false` without running
     * `check` when the user is not an admin user of the current tenant, and `false` when anything
     * throws (fail closed). Read CMS models before calling, as the current identity (A19).
     */
    canUserRead(userId: string, check: () => Promise<boolean>): Promise<boolean>;
}

/**
 * A building block for the target adapters' `ReviewTargetReadAccess.canUserRead` (R48, R67): one
 * boolean read check for a candidate, nothing else. Not a general "run as" primitive and not
 * called by the api-workflows use cases (D132).
 */
export const CandidateReadAccess = createAbstraction<ICandidateReadAccess>("CandidateReadAccess");

export namespace CandidateReadAccess {
    export type Interface = ICandidateReadAccess;
}
