import type { WorkflowExclusion } from "~/domain/settings/types.js";
import type { RoutingDirectoryUser, RoutingUser } from "./types.js";

export interface RoutingCandidatesInput {
    members: RoutingDirectoryUser[];
    candidateTeamIds: string[];
    requesterId: string;
    /** Active exclusions only (`filterActiveExclusions`). */
    exclusions: WorkflowExclusion[];
}

/**
 * The strategy candidates in their stable order (R111): members of the candidate teams, minus
 * the requester and active exclusions, sorted by user id. Read access is checked later, lazily.
 * Pure.
 */
export const listRoutingCandidates = (input: RoutingCandidatesInput): RoutingUser[] => {
    return input.members
        .filter(member => {
            return (
                member.id !== input.requesterId &&
                input.candidateTeamIds.some(teamId => member.teams?.includes(teamId)) &&
                !input.exclusions.some(exclusion => exclusion.userId === member.id)
            );
        })
        .map(member => ({ id: member.id, displayName: member.displayName }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
};
