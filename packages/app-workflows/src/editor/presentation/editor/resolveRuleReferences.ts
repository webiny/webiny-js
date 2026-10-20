import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { getReferenceLabel } from "~/editor/model/rules/getReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { addFoundTeams } from "./addFoundTeams.js";
import { addFoundUsers } from "./addFoundUsers.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

export interface ResolveRuleReferencesParams {
    // What was resolved before; kept, and never changed.
    previous: RuleReferences;
    // The ids that were asked for.
    requested: RuleReferenceIds;
    users: WorkflowUserSummary[];
    missingUserIds: string[];
    teams: WorkflowTeamSummary[];
    missingTeamIds: string[];
    // The app's folder list (empty when it did not load).
    folders: AppFolder[];
    // The `folderExists` answers for the requested folders the list does not hold, by folder id.
    folderExistence: ReadonlyMap<string, boolean>;
}

/*
 * Turns the answers of the lookups into labels (R298, `getReferenceLabel` owns the texts): found
 * users and teams by name, ids the server reported missing as deleted, listed folders by path, an
 * unlisted folder that exists as restricted and one that does not as deleted. A requested folder
 * with no answer (the existence check failed) stays unresolved. Pure; returns a new object.
 */
export const resolveRuleReferences = (params: ResolveRuleReferencesParams): RuleReferences => {
    const withUsers = addFoundUsers(params.previous, params.users);
    const withTeams = addFoundTeams(withUsers, params.teams);

    const users = new Map(withTeams.users);
    for (const id of params.missingUserIds) {
        const deleted = getReferenceLabel({ kind: "user", id, name: null, state: "deleted" });
        users.set(id, deleted);
    }
    const teams = new Map(withTeams.teams);
    for (const id of params.missingTeamIds) {
        const deleted = getReferenceLabel({ kind: "team", id, name: null, state: "deleted" });
        teams.set(id, deleted);
    }

    const folders = new Map(withTeams.folders);
    for (const requested of params.requested.folders) {
        const id = requested.id;
        const listed = params.folders.find(folder => folder.id === id);
        if (listed !== undefined) {
            const found = getReferenceLabel({
                kind: "folder",
                id,
                name: listed.path,
                state: "found"
            });
            folders.set(id, found);
            continue;
        }
        const exists = params.folderExistence.get(id);
        if (exists === true) {
            const restricted = getReferenceLabel({
                kind: "folder",
                id,
                name: null,
                state: "restricted"
            });
            folders.set(id, restricted);
        }
        if (exists === false) {
            const deleted = getReferenceLabel({
                kind: "folder",
                id,
                name: null,
                state: "deleted"
            });
            folders.set(id, deleted);
        }
    }

    return { ...withTeams, users, teams, folders };
};
