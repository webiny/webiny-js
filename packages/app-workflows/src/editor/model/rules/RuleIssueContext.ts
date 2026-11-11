import type { RuleReferences } from "./RuleReferences.js";

export interface RuleIssueContext {
    // The step's reviewing teams (`config.teams`).
    stepTeamIds: string[];
    references: RuleReferences;
}
