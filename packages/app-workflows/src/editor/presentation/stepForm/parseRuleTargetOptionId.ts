import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";

/*
 * The rule target a picker value stands for: the inverse of `toRuleTargetOptionId`, split at the
 * first colon. Null for an unknown type, an empty id or a value with no colon.
 */
export const parseRuleTargetOptionId = (optionId: string): RuleTargetValue | null => {
    const colon = optionId.indexOf(":");
    if (colon === -1) {
        return null;
    }

    const type = optionId.slice(0, colon);
    const id = optionId.slice(colon + 1);
    if (id === "") {
        return null;
    }
    if (type === "user") {
        return { type: "user", id };
    }
    if (type === "team") {
        return { type: "team", id };
    }
    return null;
};
