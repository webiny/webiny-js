import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetUserReadParams {
    userId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface ReviewTargetFolderReadParams {
    userId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** `null`: the root folder. */
    folderId: string | null;
}

export interface IReviewTargetReadAccess {
    /** Whether this adapter answers for the namespace. */
    canHandle(model: string): boolean;
    /**
     * Whether the user can read the target revision with the app's own permission logic (model,
     * folder and content access, D61, D133). The implementation reads the model and the revision as
     * the current identity and evaluates only the user's access as that user, through
     * `CandidateReadAccess` (R48, R67).
     */
    canUserRead(params: ReviewTargetUserReadParams): Promise<boolean>;
    /**
     * Whether the user could read content of the model in the folder, without a revision (R121):
     * model read and folder content read as that user; for the root folder, model read only. Same
     * identity contract as `canUserRead`. Fail closed.
     */
    canUserReadInFolder(params: ReviewTargetFolderReadParams): Promise<boolean>;
}

/**
 * The engine's question to a target adapter about another user (spec 6, 9.3; D133 point 4a). One
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
    export type UserReadParams = ReviewTargetUserReadParams;
    export type FolderReadParams = ReviewTargetFolderReadParams;
}
