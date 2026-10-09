import zod from "zod";
import type { ReviewStepConfig } from "./types.js";

const routingRuleFolderConditionSchema = zod.object({
    id: zod.string().min(1, "Folder ID is required."),
    type: zod.string().min(1, "Folder type is required."),
    includeDescendants: zod.boolean()
});

const routingRuleSchema = zod.object({
    id: zod.string().min(1, "Rule ID is required."),
    conditions: zod.object({
        requesterUserId: zod.string().min(1).optional(),
        requesterTeamId: zod.string().min(1).optional(),
        folder: routingRuleFolderConditionSchema.optional(),
        modelId: zod.string().min(1).optional()
    }),
    target: zod.object({
        type: zod.enum(["user", "team"]),
        id: zod.string().min(1, "Rule target ID is required.")
    })
});

/**
 * Config of a "review" step (spec 4.1). Validated in code until phase 5 adds the `StepType`
 * extension point; stored as JSON on the workflow and review models.
 */
export const reviewStepConfigSchema = zod.object({
    teams: zod.array(zod.string().min(1, "Team ID is required.")),
    assignment: zod.object({
        strategy: zod.enum(["none", "roundRobin", "leastLoaded"]),
        allowManualPick: zod.boolean(),
        rules: zod.array(routingRuleSchema)
    })
});

/** Parses a stored review step config; `null` when it does not match the schema. */
export const parseReviewStepConfig = (config: unknown): ReviewStepConfig | null => {
    const result = reviewStepConfigSchema.safeParse(config);
    return result.success ? result.data : null;
};
