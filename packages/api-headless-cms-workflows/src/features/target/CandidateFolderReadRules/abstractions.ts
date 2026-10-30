import { createAbstraction } from "@webiny/feature/api";
import type { FolderReadRule } from "../FolderReadRule.js";

/** A candidate, as the engine listed it (`AdminUser` fits). */
export interface CandidateFolderUser {
    id: string;
    /** Team ids, as stored on the admin user. */
    teams?: string[];
}

export interface CandidateFolderReadRuleParams {
    /** The folder the candidates are checked for; never the root folder. */
    folderId: string;
    /** Every candidate the rule is run for, with their teams, so no user is read per check. */
    users: CandidateFolderUser[];
}

export interface ICandidateFolderReadRules {
    /**
     * A folder rule run as each candidate, inside `CandidateReadAccess`. The folder's permission
     * record is read once, on first use, and the candidates' teams once (only with teams on and
     * a team grant on the folder); each candidate's access is then evaluated in memory as
     * `FolderLevelPermissions.getFolderLevelPermissions` and `canAccessFolderContent` evaluate it
     * for that user: the team grants of the user's teams, then the defaults (full access is
     * owner, a folder without permissions is public). Another folder answers `false`.
     */
    create(params: CandidateFolderReadRuleParams): FolderReadRule;
}

/**
 * Folder content read for routing candidates (R48, Q79): one folder permission read per routing
 * evaluation instead of one per candidate, and no team lookup per candidate. Shared by the CMS and
 * Website Builder adapters, which check folders by id.
 */
export const CandidateFolderReadRules = createAbstraction<ICandidateFolderReadRules>(
    "CandidateFolderReadRules"
);

export namespace CandidateFolderReadRules {
    export type Interface = ICandidateFolderReadRules;
    export type User = CandidateFolderUser;
    export type Params = CandidateFolderReadRuleParams;
}
