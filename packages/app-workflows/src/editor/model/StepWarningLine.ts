/*
 * One line of a step's warnings. `error` is a live rule error (destructive on the card, Save is
 * blocked by `validateWorkflowDraft`), `warning` never blocks. `ruleId` is set on the rule lines
 * only, so a server error for the same rule can replace the live line (no double line).
 */
export interface StepWarningLine {
    text: string;
    severity: "error" | "warning";
    ruleId?: string;
}
