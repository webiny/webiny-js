import { createAbstraction } from "@webiny/feature/api";
import type { RoutingReadScope } from "~/domain/routing/types.js";

/** An admin user of the current tenant, as the engine already listed it (`AdminUser` fits). */
export interface ReviewTargetReadUser {
    id: string;
    displayName: string;
    /** The user's team ids, as stored on the admin user. */
    teams?: string[];
}

export interface ReviewTargetReadUsersParams {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /**
     * A target revision, or a folder without a revision (R121): model read and folder content
     * read only; for the root folder, model read only.
     */
    read: RoutingReadScope;
    /**
     * Admin users of the current tenant, listed by the caller (`ListUsersUseCase`); the adapter
     * does not look them up again.
     */
    users: ReviewTargetReadUser[];
    /**
     * Stop once this many readable users are found, checking `users` in order (the strategy picks
     * the first readable candidate, R111). Every user is checked when omitted.
     */
    limit?: number;
}

export interface IReviewTargetReadAccess {
    /** Whether this adapter answers for the namespace. */
    canHandle(model: string): boolean;
    /**
     * The ids of the users who can read the target revision (or the folder's content) with the
     * app's own permission logic (model, folder and content access, D61, D133), in the order of
     * `users`. The target, the model and the folder's permission record are read once per call, as
     * the current identity (A19); only each user's access is evaluated as that user, through
     * `CandidateReadAccess` (R48, R67), in memory once the user's permissions are loaded. Fail
     * closed: a user whose check fails is left out, and a target that cannot be read leaves
     * everyone out.
     */
    filterReadableUsers(params: ReviewTargetReadUsersParams): Promise<string[]>;
}

/**
 * The engine's question to a target adapter about other users (spec 6, 9.3; D133 point 4a). One
 * implementation per namespace, registered by the app adapters; the last registered match wins and
 * no match means no access (R50). Routing asks it for picks, rule targets and strategy candidates,
 * reassign for the chosen user, the step-candidate list for every member and the inspector for
 * folder-level access (R111, R112, R120, R121); the engine never asks it about the caller, whose
 * checks are the app wrappers'. Not to be confused with the 1b
 * `ReviewTargetAccess` flags type (`domain/review/types.ts`, R71).
 */
export const ReviewTargetReadAccess =
    createAbstraction<IReviewTargetReadAccess>("ReviewTargetReadAccess");

export namespace ReviewTargetReadAccess {
    export type Interface = IReviewTargetReadAccess;
    export type User = ReviewTargetReadUser;
    export type UsersParams = ReviewTargetReadUsersParams;
}
