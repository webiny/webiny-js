import type { ReferenceLabel } from "./ReferenceLabel.js";

/*
 * What the editor has resolved for the references of the rules (R298). An id missing from a map is
 * unresolved (not looked up yet, or the lookup failed) and is never an issue. `userTeamIds` is a
 * user's team ids from `listUsers` (R286); a user without an entry has unknown teams.
 */
export interface RuleReferences {
    users: ReadonlyMap<string, ReferenceLabel>;
    teams: ReadonlyMap<string, ReferenceLabel>;
    folders: ReadonlyMap<string, ReferenceLabel>;
    userTeamIds: ReadonlyMap<string, string[]>;
}
