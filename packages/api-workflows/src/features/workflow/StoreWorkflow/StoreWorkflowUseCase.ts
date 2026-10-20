import { isDeepStrictEqual } from "node:util";
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import { AI_STEP_TYPE, REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { RULE_TARGET_FIELD } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_USER_NOT_MEMBER_MESSAGE } from "~/domain/workflow/ruleErrorMessages.js";
import {
    isWorkflowValidationError,
    WorkflowConflictError,
    WorkflowNotFoundError,
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import {
    WorkflowAfterCreateEvent,
    WorkflowAfterUpdateEvent,
    WorkflowBeforeCreateEvent,
    WorkflowBeforeUpdateEvent
} from "./events.js";
import { StoreWorkflowUseCase as UseCase } from "./abstractions.js";

const WORKFLOW_NOT_FOUND = "Workflows/Workflow/NotFound";

class StoreWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private stepTypes: StepTypeRegistryService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // Each step is validated by its registered step type (R131). While no `ai` type is
        // registered (ai-powerups registers it, R177) an `ai` step gets its own message (R132).
        const validation = WorkflowValidator.validate(input.workflow, step => {
            const stepType = this.stepTypes.get(step.type);
            if (!stepType) {
                let message = `Step "${step.title}" uses an unknown step type "${step.type}".`;
                if (step.type === AI_STEP_TYPE) {
                    message = `Step "${step.title}" uses the step type "ai", which is not available.`;
                }
                return Result.fail(
                    new WorkflowValidationError(message, { stepId: step.id, field: "type" })
                );
            }
            return stepType.validate({ step, workflow: input.workflow });
        });
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        const values = validation.value;

        // Spec 6, R122: user targets must be members of the step's teams. One lookup per step with
        // user targets; a membership lookup, not an access decision, so it runs as the system
        // (`ListUsers` needs `adminUsers.user`, D48).
        for (const step of values.steps) {
            const config =
                step.type === REVIEW_STEP_TYPE ? parseReviewStepConfig(step.config) : null;
            if (!config) {
                continue;
            }
            const userRules = config.assignment.rules.filter(rule => rule.target.type === "user");
            if (userRules.length === 0) {
                continue;
            }
            const userIds = [...new Set(userRules.map(rule => rule.target.id))];
            let listed: Result<AdminUser[], ListUsersUseCase.Error>;
            try {
                listed = await this.identityContext.withoutAuthorization(() => {
                    return this.listUsers.execute({
                        where: { id_in: userIds, teams_in: [...config.teams] }
                    });
                });
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            if (listed.isFail()) {
                return Result.fail(new WorkflowPersistenceError(listed.error));
            }
            const memberIds = new Set(listed.value.map(user => user.id));
            const invalid = userRules.find(rule => !memberIds.has(rule.target.id));
            if (invalid) {
                return Result.fail(
                    new WorkflowValidationError(RULE_TARGET_USER_NOT_MEMBER_MESSAGE, {
                        stepId: step.id,
                        field: RULE_TARGET_FIELD,
                        ruleId: invalid.id
                    })
                );
            }
        }

        const existingResult = await this.repository.get(values.id);
        if (existingResult.isFail() && existingResult.error.code !== WORKFLOW_NOT_FOUND) {
            return Result.fail(existingResult.error);
        }
        const existing = existingResult.isOk() ? existingResult.value : null;

        // Read-then-write: two concurrent saves with the same `savedOn` can both pass; accepted (D131, admin edits are rare).
        if (existing && existing.savedOn !== input.savedOn) {
            return Result.fail(
                new WorkflowConflictError({
                    savedOn: existing.savedOn,
                    savedBy: existing.savedBy
                })
            );
        }
        if (!existing && input.savedOn) {
            // No tombstone: the caller only learns that the workflow no longer exists (D123).
            return Result.fail(new WorkflowNotFoundError({ id: values.id }));
        }

        // v1: one workflow per model; the race between two saves is accepted (D41). `limit: 10` is
        // enough because the v1 invariant allows at most one other workflow per model.
        // On OpenSearch the list lags DynamoDB, widening the accepted D41 race to saves within the refresh window.
        const sameModel = await this.repository.list({
            where: { models_in: values.models },
            limit: 10
        });
        if (sameModel.isFail()) {
            return Result.fail(sameModel.error);
        }
        const other = sameModel.value.items.find(item => item.id !== values.id);
        if (other) {
            const model =
                other.models.find(item => values.models.includes(item)) ?? values.models[0];
            return Result.fail(
                new WorkflowValidationError(
                    `The model "${model}" already has a workflow: "${other.name}".`,
                    { field: "models", workflowId: other.id }
                )
            );
        }

        // R165: the I/O check of a step type runs only for a step that is new or changed versus
        // the stored workflow, so a workflow whose model or connection was removed later can still
        // be saved without touching that step. It runs after the conflict, not-found and
        // same-model checks above, so those win over a check failure. A stored config that went
        // through storage with an `undefined` key dropped compares as changed, which only means
        // one more check.
        const storedSteps = new Map((existing?.steps ?? []).map(step => [step.id, step]));
        for (const step of values.steps) {
            const stepType = this.stepTypes.get(step.type);
            if (!stepType?.checkConfig) {
                continue;
            }
            const stored = storedSteps.get(step.id);
            if (
                stored &&
                stored.type === step.type &&
                isDeepStrictEqual(stored.config, step.config)
            ) {
                continue;
            }
            let checked: Result<void, WorkflowValidationError>;
            try {
                checked = await stepType.checkConfig({ step, workflow: values });
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            if (checked.isFail()) {
                return Result.fail(checked.error);
            }
        }

        const actor = input.actor;

        if (existing) {
            // Before handlers reject a save by throwing `WorkflowValidationError`.
            try {
                await this.eventPublisher.publish(
                    new WorkflowBeforeUpdateEvent({ original: existing, workflow: values, actor })
                );
            } catch (error) {
                if (isWorkflowValidationError(error)) {
                    return Result.fail(error);
                }
                throw error;
            }

            const updated = await this.repository.update(values);
            if (updated.isFail()) {
                return Result.fail(updated.error);
            }

            await this.eventPublisher.publish(
                new WorkflowAfterUpdateEvent({ original: existing, workflow: updated.value, actor })
            );
            return Result.ok(updated.value);
        }

        // Before handlers reject a save by throwing `WorkflowValidationError`.
        try {
            await this.eventPublisher.publish(
                new WorkflowBeforeCreateEvent({ workflow: values, actor })
            );
        } catch (error) {
            if (isWorkflowValidationError(error)) {
                return Result.fail(error);
            }
            throw error;
        }

        const created = await this.repository.create(values);
        if (created.isFail()) {
            return Result.fail(created.error);
        }

        await this.eventPublisher.publish(
            new WorkflowAfterCreateEvent({ workflow: created.value, actor })
        );
        return Result.ok(created.value);
    }
}

export const StoreWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [
        WorkflowRepository,
        EventPublisher,
        IdentityContext,
        ListUsersUseCase,
        StepTypeRegistryService
    ]
});
