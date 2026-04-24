import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { GetTargetWorkflowStateUseCase } from "../GetTargetWorkflowState/index.js";
import {
    CreateWorkflowStateRepository,
    CreateWorkflowStateUseCase as UseCase
} from "./abstractions.js";
import { WorkflowStateAfterCreateEvent } from "./events.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateRecordState } from "~/domain/workflowState/abstractions.js";
import {
    WorkflowStateValidationError,
    ActiveStateExistsError,
    MultipleWorkflowsFoundError,
    WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import { WorkflowNotFoundError } from "~/domain/workflow/errors.js";

class CreateWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private getTargetState: GetTargetWorkflowStateUseCase.Interface,
        private repository: CreateWorkflowStateRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const { id: targetId, version } = parseIdentifier(input.targetRevisionId);
        if (!version) {
            return Result.fail(
                new WorkflowStateValidationError(
                    "Cannot create a workflow state without version of a target record."
                )
            );
        }

        const workflowsResult = await this.listWorkflows.execute({
            where: {
                app: input.app
            },
            limit: 1
        });

        if (workflowsResult.isFail()) {
            return Result.fail(new WorkflowStatePersistenceError(workflowsResult.error));
        }

        const { items: workflows, meta } = workflowsResult.value;
        const workflow = workflows[0];

        if (!workflow) {
            return Result.fail(
                new WorkflowNotFoundError({
                    id: "",
                    app: input.app
                })
            );
        }

        if (meta.totalCount > 1) {
            return Result.fail(
                new MultipleWorkflowsFoundError({
                    app: input.app,
                    targetRevisionId: input.targetRevisionId,
                    workflows,
                    meta
                })
            );
        }

        const existingStateResult = await this.getTargetState.execute({
            app: input.app,
            targetRevisionId: input.targetRevisionId
        });

        if (existingStateResult.isOk()) {
            return Result.fail(
                new ActiveStateExistsError({
                    app: input.app,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        if (workflow.steps.length === 0) {
            return Result.fail(
                new WorkflowStateValidationError(
                    "Cannot create a workflow state for a workflow that has no steps defined."
                )
            );
        }

        const identity = this.identityContext.getIdentity();

        const record: CreateWorkflowStateRepository.Input = {
            workflowId: workflow.id,
            comment: undefined,
            state: WorkflowStateRecordState.pending,
            app: input.app,
            title: input.title,
            targetId,
            isActive: true,
            targetRevisionId: input.targetRevisionId,
            steps: workflow.steps.map(step => ({
                ...step,
                state: WorkflowStateRecordState.pending,
                savedBy: null,
                comment: null
            }))
        };

        const createResult = await this.repository.execute(record);
        if (createResult.isFail()) {
            return Result.fail(createResult.error);
        }

        const createdRecord = createResult.value;

        const teamsResult = await this.getUserTeams.execute(identity.id);
        const teams = teamsResult.value;
        const workflowState = new WorkflowState(createdRecord, teams, identity);

        await this.eventPublisher.publish(
            new WorkflowStateAfterCreateEvent({
                state: workflowState
            })
        );

        return Result.ok(workflowState);
    }
}

export const CreateWorkflowStateUseCase = UseCase.createImplementation({
    implementation: CreateWorkflowStateUseCaseImpl,
    dependencies: [
        IdentityContext,
        GetUserTeamsUseCase,
        EventPublisher,
        ListWorkflowsUseCase,
        GetTargetWorkflowStateUseCase,
        CreateWorkflowStateRepository
    ]
});
