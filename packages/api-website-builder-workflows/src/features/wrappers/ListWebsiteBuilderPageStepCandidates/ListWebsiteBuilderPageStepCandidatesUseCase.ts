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
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase as UseCase } from "./abstractions.js";

const ACTION = "list the step's candidates";

/**
 * The page checks are `RequestWebsiteBuilderPageReviewUseCase`'s: the entity-level write
 * permission before anything is read (R75), a page the viewer cannot see is not found, a visible
 * page without write access is not authorized. A workflow of another app is not found (R128).
 * The viewer is the requester the engine leaves out of the list.
 */
class ListWebsiteBuilderPageStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
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

        let canWriteAnyPage: boolean;
        try {
            canWriteAnyPage = await this.access.canWriteAnyPage();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canWriteAnyPage) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        let target: WbPageTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: WB_PAGE_NAMESPACE,
                targetRevisionId: input.targetRevisionId
            });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!target || target.page.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: WB_PAGE_NAMESPACE,
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
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        const workflow = await this.getWorkflow.execute({ id: input.workflowId });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        // R128, R46: another app's workflow is not found here; its name never leaks.
        if (!isWbWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflowId }));
        }

        const candidates = await this.listCandidates.execute({
            workflowId: input.workflowId,
            stepId: input.stepId,
            model: WB_PAGE_NAMESPACE,
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

export const ListWebsiteBuilderPageStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageStepCandidatesUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WbPageTargetReader,
        WbPageAccess,
        GetWorkflowUseCase,
        ListStepCandidatesUseCase
    ]
});
