import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";

// The picker value of a rule target (R307): `user:<id>` or `team:<id>`.
export const toRuleTargetOptionId = (target: RuleTargetValue): string => {
    return `${target.type}:${target.id}`;
};
