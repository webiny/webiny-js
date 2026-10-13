import { Result } from "@webiny/feature/api";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingEvaluation } from "~/domain/routing/types.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { InspectRoutingUseCase as UseCase } from "./abstractions.js";

class InspectRoutingUseCaseImpl implements UseCase.Interface {
    constructor(private routing: RoutingEvaluatorService.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const parsed = reviewStepConfigSchema.safeParse(input.stepConfig);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return Result.fail(
                new WorkflowValidationError(
                    `The step configuration is invalid: ${issue?.message ?? "unknown error"}`
                )
            );
        }
        // Save refuses a team target outside the step's teams (spec 6); the inspector does too.
        for (const rule of parsed.data.assignment.rules) {
            if (rule.target.type === "team" && !parsed.data.teams.includes(rule.target.id)) {
                return Result.fail(
                    new WorkflowValidationError(
                        `Routing rule "${rule.id}" targets a team that is not one of the step's teams.`
                    )
                );
            }
        }

        // An unsaved config has no stored workflow: no round-robin history, no pick. Read access
        // is checked at folder level as the request identity (A47, SEC-66).
        let evaluated: Result<RoutingEvaluation, RoutingDependencyError>;
        try {
            evaluated = await this.routing.evaluate({
                config: parsed.data,
                model: input.model,
                workflowId: null,
                reviewId: null,
                stepId: "",
                requesterId: input.requesterId,
                pickedUserId: null,
                folder: input.folder ? { ...input.folder } : null,
                read: { type: "folder", folderId: input.folder?.id ?? null },
                now: input.now
            });
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (evaluated.isFail()) {
            return Result.fail(evaluated.error);
        }
        const evaluation = evaluated.value;

        return Result.ok({
            owner: evaluation.owner
                ? { id: evaluation.owner.id, displayName: evaluation.owner.displayName }
                : null,
            source: evaluation.source,
            ruleId: evaluation.ruleId,
            strategy: evaluation.strategy,
            trace: evaluation.trace.map(entry => ({ ...entry })),
            skipped: evaluation.skipped.map(item => ({ ...item }))
        });
    }
}

export const InspectRoutingUseCase = UseCase.createImplementation({
    implementation: InspectRoutingUseCaseImpl,
    dependencies: [RoutingEvaluatorService]
});
