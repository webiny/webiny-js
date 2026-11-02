import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { redactStepCandidates } from "@webiny/api-workflows/domain/routing/redactStepCandidates.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { ListCmsEntryStepCandidatesUseCase as UseCase } from "./abstractions.js";

/**
 * The target checks are `RequestCmsEntryReviewUseCase`'s: a target of another app or one the
 * viewer cannot see is not found (R46), a visible target without write access is not authorized.
 * A workflow of another app is not found either (R128), as `GetCmsEntryWorkflowUseCase` answers.
 * The viewer is the requester the engine leaves out of the list.
 */
class ListCmsEntryStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private listCandidates: ListStepCandidatesUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        // A failed team or permission load is a persistence error, never a rejection (R87).
        let viewer: Awaited<CurrentReviewViewer.Return>;
        try {
            viewer = await this.viewer.get();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        let target: CmsEntryTargetReader.Target | null = null;
        if (isCmsNamespace(input.model)) {
            try {
                target = await this.targets.read({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                });
            } catch (error) {
                return Result.fail(
                    new ReviewPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
        }
        if (!target || target.entry.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }
        let canWrite: boolean;
        try {
            canWrite = await this.access.canWrite(target);
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canWrite) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "list the step's candidates" })
            );
        }

        const workflow = await this.getWorkflow.execute({ id: input.workflowId });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        // R128, R46: another app's workflow is not found here; its name never leaks.
        if (!isCmsWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflowId }));
        }

        const candidates = await this.listCandidates.execute({
            workflowId: input.workflowId,
            stepId: input.stepId,
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            requesterId: viewer.value.actor.id
        });
        if (candidates.isFail()) {
            return Result.fail(candidates.error);
        }
        return Result.ok(redactStepCandidates(candidates.value, viewer.value.permissions));
    }
}

export const ListCmsEntryStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryStepCandidatesUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        CmsEntryTargetReader,
        CmsEntryAccess,
        GetWorkflowUseCase,
        ListStepCandidatesUseCase
    ]
});
