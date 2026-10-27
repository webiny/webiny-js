import { ROUTING_SKIP_REASONS } from "./reasons.js";
import type { RoutingSkipReason } from "./reasons.js";
import type { RoutingCandidatesInput } from "./listRoutingCandidates.js";

export interface StrategySkipsInput extends RoutingCandidatesInput {
    /** The requester's pick, which the pick branch already records. */
    pickedUserId: string | null;
}

export interface StrategySkip {
    userId: string;
    displayName: string;
    /** The fixed reason for the record (D89, D97). */
    reason: RoutingSkipReason;
    /** The reason the inspector shows: an exclusion's own text when it has one (R129). */
    shownReason: string;
}

/**
 * The members of the candidate teams that `listRoutingCandidates` drops: the requester and the
 * actively excluded, sorted by user id. The requester wins when both apply, and the picked user
 * is left out because the pick branch records them. Pure.
 */
export const listStrategySkips = (input: StrategySkipsInput): StrategySkip[] => {
    const skips: StrategySkip[] = [];
    for (const member of input.members) {
        if (!input.candidateTeamIds.some(id => member.teams?.includes(id))) {
            continue;
        }
        if (member.id === input.pickedUserId) {
            continue;
        }
        if (member.id === input.requesterId) {
            skips.push({
                userId: member.id,
                displayName: member.displayName,
                reason: ROUTING_SKIP_REASONS.requester,
                shownReason: ROUTING_SKIP_REASONS.requester
            });
            continue;
        }
        const exclusion = input.exclusions.find(item => item.userId === member.id);
        if (exclusion) {
            skips.push({
                userId: member.id,
                displayName: member.displayName,
                reason: ROUTING_SKIP_REASONS.excluded,
                shownReason: exclusion.reason || ROUTING_SKIP_REASONS.excluded
            });
        }
    }
    return skips.sort((a, b) => (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0));
};
