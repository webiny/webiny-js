/*
 * A problem of one rule. `error` blocks Save and is shown destructive, `warning` never blocks.
 * `index` is the rule's position at the time the issues were computed (0-based); the strip text
 * `Rule {n}:` is `index + 1`.
 */
export interface RuleIssue {
    ruleId: string;
    index: number;
    kind: "error" | "warning";
    field: "target" | "requesterUser" | "requesterTeam" | "folder";
    message: string;
}
