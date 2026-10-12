import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import {
    isWorkflowValidationError,
    WorkflowConflictError,
    WorkflowNotFoundError,
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
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const validation = WorkflowValidator.validate(input.workflow);
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        const values = validation.value;

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
                    `The model "${model}" already has a workflow: "${other.name}".`
                )
            );
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
    dependencies: [WorkflowRepository, EventPublisher]
});
