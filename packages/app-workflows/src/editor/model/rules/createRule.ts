import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { createRuleId } from "~/editor/model/createRuleId.js";

/*
 * A new rule (R296): no conditions and the pool of the first reviewing team as its target, or no
 * target when the step has no teams. The design preselects a member of that team; that needs a
 * member lookup before the card appears, so the pool is the default (one pick from a person).
 */
export const createRule = (teamIds: string[], existingIds: string[]): RuleValue => {
    const id = createRuleId(existingIds);
    const firstTeamId = teamIds[0];

    return {
        id,
        requesterUserId: null,
        requesterTeamId: null,
        folder: null,
        target: firstTeamId === undefined ? null : { type: "team", id: firstTeamId },
        preserved: {}
    };
};
