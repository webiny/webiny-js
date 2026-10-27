import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryTarget } from "../CmsEntryTargetReader/abstractions.js";
import type { FolderReadRule } from "../FolderReadRule.js";

export interface CmsEntryFolderReadParams {
    /** Read as the current identity before the check (A19). */
    model: CmsModel;
    group: CmsGroup;
    /** `null` or "root": the root folder, no folder-level check. */
    folderId: string | null;
    /** Decides the folder from permissions loaded once; one folder read per check when omitted. */
    folderRule?: FolderReadRule;
}

export interface ICmsEntryAccess {
    /**
     * Read access of the current identity (review actions, get review). With `folderRule`, the
     * folder is decided by the rule (folder permissions loaded once for many checks, Q79), so the
     * check reads nothing; without it, the folder's permissions are read for this check.
     */
    canRead(target: CmsEntryTarget, folderRule?: FolderReadRule): Promise<boolean>;
    /** Write access of the current identity (request a review, D77). */
    canWrite(target: CmsEntryTarget): Promise<boolean>;
    /** Delete access of the current identity (trash or delete, cancel-for-delete, D134). */
    canDelete(target: CmsEntryTarget): Promise<boolean>;
    /**
     * Entity-level delete permission for a `cms.*` namespace, as `DeleteEntryUseCase` checks it
     * before it loads an entry (`canAccessEntry({ model, rwd: "d" })`), plus group and model read.
     * `false` for another app's namespace, a private, missing or unreadable model or group. Lets
     * the cancel-for-delete wrapper refuse before it reads anything (R86).
     */
    canDeleteAnyEntry(namespace: string): Promise<boolean>;
    /**
     * Read access of the current identity to the model's entries in a folder, without an entry
     * (the routing inspector, R121): group read, model read, entity-level entry read and the
     * folder's content read. Evaluated as another user inside `CandidateReadAccess`.
     */
    canReadInFolder(params: CmsEntryFolderReadParams): Promise<boolean>;
}

/**
 * The CMS's own entry access logic for the current identity (R47, R72): group read, model read
 * and entry permissions (incl. own-only) through `AccessControl`, plus folder-level permissions on
 * the entry's folder. Evaluated as another user inside `CandidateReadAccess` for `canUserRead`
 * (R48).
 */
export const CmsEntryAccess = createAbstraction<ICmsEntryAccess>("CmsEntryAccess");

export namespace CmsEntryAccess {
    export type Interface = ICmsEntryAccess;
    export type FolderReadParams = CmsEntryFolderReadParams;
}
