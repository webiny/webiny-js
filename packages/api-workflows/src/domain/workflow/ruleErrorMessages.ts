/**
 * The field of every rule-level failure (R288): the rule is named by `ruleId` in the error data,
 * not by an index, so the editor finds it again after a reorder.
 */
export const RULE_TARGET_FIELD = "config.assignment.rules.target";

/** A user target who is not a member of the step's teams; checked on save (R122, Q51). */
export const RULE_TARGET_USER_NOT_MEMBER_MESSAGE =
    "The target user is not a member of the step's teams.";

/** A team target outside the step's teams; checked on save and by the inspector (Q52). */
export const RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE =
    "The target team is not one of the step's reviewing teams.";

/**
 * A rule without a target. Save names the step; the inspector has only the config and no step
 * title, so it passes `null`.
 */
export const getRuleTargetMissingMessage = (stepTitle: string | null): string => {
    if (stepTitle === null) {
        return "Every routing rule needs a target.";
    }
    return `Every routing rule in step "${stepTitle}" needs a target.`;
};
