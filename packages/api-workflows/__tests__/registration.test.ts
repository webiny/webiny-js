import { describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { GetReviewStepRunUseCase } from "~/features/stepRun/GetReviewStepRun/index.js";
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ReassignReviewStepUseCase } from "~/features/review/ReassignReviewStep/index.js";
import { RestartReviewStepUseCase } from "~/features/review/RestartReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
import { ListReviewsUseCase } from "~/features/review/ListReviews/index.js";
import { ReviewListLimits } from "~/features/review/ListReviews/ReviewListLimits.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "~/features/review/DeleteTargetReviews/index.js";
import { GetBoundWorkflowUseCase } from "~/features/workflow/GetBoundWorkflow/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "~/features/review/ReviewTargetReadAccess/index.js";
import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";
import { ReviewTargetUpdateGuard } from "~/features/review/ReviewTargetUpdateGuard/index.js";
import { ReviewTargetFolderChangeGuard } from "~/features/review/ReviewTargetFolderChangeGuard/index.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListReviewAssignmentsUseCase } from "~/features/assignment/ListReviewAssignments/index.js";
import { InspectRoutingUseCase } from "~/features/routing/InspectRouting/index.js";
import { ListStepCandidatesUseCase } from "~/features/routing/ListStepCandidates/index.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";
import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomationDefinitions/index.js";
import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";
import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
import { ListWorkflowTeamsUseCase } from "~/features/config/ListWorkflowTeams/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { WorkflowSettingsModelProvider } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import {
    ListNotificationTransportsRepository,
    ListNotificationTransportsUseCase
} from "~/features/notifications/ListNotificationTransports/abstractions.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { CurrentUserTeams } from "~/features/identity/CurrentUserTeams/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { CandidateReadAccess } from "~/features/identity/CandidateReadAccess/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { StepRunReachService } from "~/features/stepRun/StepRunReachService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STEP_RUN_TASK_DEFINITION_ID } from "~/features/stepRun/constants.js";
import {
    AutomationDefinition,
    type AutomationOutcome,
    type AutomationRunParams,
    type IAutomationDefinition
} from "~/features/automation/AutomationDefinition/index.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { StepType } from "~/features/stepTypes/StepType/index.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";

// Type-level pin of the public automation exports (R134), checked by `check:test:types`.
type AutomationExports = [AutomationOutcome, AutomationRunParams, IAutomationDefinition];
export type { AutomationExports };

describe("WorkflowsFeature registration", () => {
    it("registers every workflows abstraction once (D18)", async () => {
        // `NotificationTransport` depends on the mailer, which the test context does not provide.
        const { context } = await createContextHandler({
            setup: container => {
                container.registerInstance(MailerService, {} as MailerService.Interface);
            }
        });
        const { container } = context;

        expect(container.resolveAll(GetWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowsUseCase)).toHaveLength(1);
        expect(container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(DeleteWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(RequestReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetReviewStepRunUseCase)).toHaveLength(1);
        expect(container.resolveAll(StuckStepService)).toHaveLength(1);
        expect(container.resolveAll(StepRunStaleCheckService)).toHaveLength(1);
        expect(container.resolveAll(StepRunnerRegistryService)).toHaveLength(1);
        // The built-in automation runner; later sub-phases register their own next to it (R168).
        expect(container.resolveAll(StepRunner)).toHaveLength(1);
        expect(container.resolveAll(StartReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(TakeOverReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReassignReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(RestartReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(ApproveReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(RejectReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(CancelReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetTargetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetUpdateGuard)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetFolderChangeGuard)).toHaveLength(1);
        expect(container.resolveAll(ListTargetReviewsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListReviewCandidateTeamsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListReviewsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReviewListLimits)).toHaveLength(1);
        expect(container.resolveAll(DeleteTargetReviewsUseCase)).toHaveLength(1);
        expect(container.resolveAll(CancelTargetReviewsUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetBoundWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReviewSaver)).toHaveLength(1);
        expect(container.resolveAll(ReviewStepReacher)).toHaveLength(1);
        expect(container.resolveAll(StepTypeRegistryService)).toHaveLength(1);
        // `review` and `automation` (ai-powerups registers `ai`, R177).
        expect(container.resolveAll(StepType)).toHaveLength(2);
        expect(container.resolveAll(AutomationDefinitionRegistryService)).toHaveLength(1);
        // No built-in automation (R155): developers register definitions.
        expect(container.resolveAll(AutomationDefinition)).toHaveLength(0);
        // The AI tool registry and the two built-in tools (Task 10)
        expect(container.resolveAll(WorkflowAiToolRegistryService)).toHaveLength(1);
        expect(container.resolveAll(WorkflowAiTool)).toHaveLength(2);
        // No default loader, sync or target read access: the app adapters register one per namespace.
        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);
        // The editor service is registered; the adapters register the editors (Tasks 11-13).
        expect(container.resolveAll(ReviewTargetEditorService)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);
        expect(container.resolveAll(RoutingEvaluatorService)).toHaveLength(1);
        expect(container.resolveAll(RoutingStrategyService)).toHaveLength(1);
        expect(container.resolveAll(CandidateReadAccess)).toHaveLength(1);
        expect(container.resolveAll(StepAssignmentResolver)).toHaveLength(1);
        expect(container.resolveAll(ReviewRepository)).toHaveLength(1);
        expect(container.resolveAll(AssignmentRepository)).toHaveLength(1);
        expect(container.resolveAll(ListReviewAssignmentsUseCase)).toHaveLength(1);
        expect(container.resolveAll(InspectRoutingUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListStepCandidatesUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetWorkflowSettingsUseCase)).toHaveLength(1);
        expect(container.resolveAll(SaveWorkflowSettingsUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetWorkflowSettingsForEditorUseCase)).toHaveLength(1);
        expect(container.resolveAll(SaveWorkflowSettingsForEditorUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowStepTypesUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListAutomationDefinitionsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowAiToolsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowNotificationTransportsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowUsersUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowTeamsUseCase)).toHaveLength(1);
        expect(container.resolveAll(WorkflowRepository)).toHaveLength(1);
        expect(container.resolveAll(WorkflowModelProvider)).toHaveLength(1);
        expect(container.resolveAll(ReviewModelProvider)).toHaveLength(1);
        expect(container.resolveAll(AssignmentModelProvider)).toHaveLength(1);
        expect(container.resolveAll(WorkflowSettingsModelProvider)).toHaveLength(1);
        expect(container.resolveAll(WorkflowSettingsRepository)).toHaveLength(1);
        expect(container.resolveAll(ListNotificationTransportsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListNotificationTransportsRepository)).toHaveLength(1);
        expect(container.resolveAll(NotificationTransport)).toHaveLength(1);
        expect(container.resolveAll(WorkflowsPermissions)).toHaveLength(1);
        expect(container.resolveAll(WorkflowEditorAccess)).toHaveLength(1);
        expect(container.resolveAll(CurrentUserTeams)).toHaveLength(1);
        expect(container.resolveAll(CurrentReviewViewer)).toHaveLength(1);
        expect(container.resolveAll(WorkflowBypassService)).toHaveLength(1);
        expect(container.resolveAll(ReviewTaskAbortService)).toHaveLength(1);
        expect(container.resolveAll(StepRunReachService)).toHaveLength(1);
        expect(
            container
                .resolveAll(TaskDefinition)
                .filter(item => item.id === STEP_RUN_TASK_DEFINITION_ID)
        ).toHaveLength(1);
    });

    it.each(["wbyWorkflow", "wbyWorkflowReview", "wbyWorkflowAssignment", "wbyWorkflowSettings"])(
        "resolves the %s model through GetModelUseCase",
        async modelId => {
            const { context } = await createContextHandler();

            const result = await context.container.resolve(GetModelUseCase).execute(modelId);

            expect(result.isOk()).toBe(true);
        }
    );

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
