import type { StepFormOptions } from "../../StepFormOptions.js";

// The slices of the step form options a rule card reads (R307, R298).
export type RuleCardOptions = Pick<
    StepFormOptions,
    "assignment" | "teams" | "users" | "targetMembers" | "folders" | "references"
>;
