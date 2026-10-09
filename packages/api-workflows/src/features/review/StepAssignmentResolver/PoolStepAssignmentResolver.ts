import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { StepAssignmentResolver } from "./abstractions.js";

/** Every review step goes to its teams' pool; picks are stored but ignored until phase 4 (R3). */
class PoolStepAssignmentResolverImpl implements StepAssignmentResolver.Interface {
    async resolve(
        params: StepAssignmentResolver.Params
    ): Promise<StepAssignmentResolver.Resolution> {
        // Save-time validation guarantees a parsable config. An unparsable one (edited storage)
        // leaves an empty pool; phase 5 fails such steps ("fail on invalid settings").
        const config = parseReviewStepConfig(params.step.config);
        return {
            owner: null,
            candidateTeamIds: config ? [...config.teams] : [],
            assignment: { source: "pool" }
        };
    }
}

export const PoolStepAssignmentResolver = StepAssignmentResolver.createImplementation({
    implementation: PoolStepAssignmentResolverImpl,
    dependencies: []
});
