import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ReviewModel } from "~/domain/review/review.model.js";
import { AssignmentModel } from "~/domain/assignment/assignment.model.js";
import { WorkflowSettingsModel } from "~/domain/settings/settings.model.js";
import { ListNotificationTransportsFeature } from "~/features/notifications/ListNotificationTransports/feature.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/feature.js";
import { ReviewNotificationsFeature } from "~/features/notifications/feature.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { ReviewSharedFeature } from "~/features/review/shared/feature.js";
import { ReviewLifecycleFeature } from "~/features/review/ReviewLifecycleFeature.js";
import { StuckStepFeature } from "~/features/stepRun/StuckStepService/feature.js";
import { RequestReviewFeature } from "~/features/review/RequestReview/feature.js";
import { GetReviewFeature } from "~/features/review/GetReview/feature.js";
import { StartReviewStepFeature } from "~/features/review/StartReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "~/features/review/TakeOverReviewStep/feature.js";
import { ReassignReviewStepFeature } from "~/features/review/ReassignReviewStep/feature.js";
import { RestartReviewStepFeature } from "~/features/review/RestartReviewStep/feature.js";
import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/feature.js";
import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
import { GetTargetReviewFeature } from "~/features/review/GetTargetReview/feature.js";
import { GetActiveTargetReviewFeature } from "~/features/review/GetActiveTargetReview/feature.js";
import { ListTargetReviewsFeature } from "~/features/review/ListTargetReviews/feature.js";
import { ListReviewsByTargetsFeature } from "~/features/review/ListReviewsByTargets/feature.js";
import { ListReviewCandidateTeamsFeature } from "~/features/review/ListReviewCandidateTeams/feature.js";
import { ListReviewsFeature } from "~/features/review/ListReviews/feature.js";
import { ListReviewedModelsFeature } from "~/features/review/ListReviewedModels/feature.js";
import { CancelTargetReviewsFeature } from "~/features/review/CancelTargetReviews/feature.js";
import { DeleteTargetReviewsFeature } from "~/features/review/DeleteTargetReviews/feature.js";
import { GetBoundWorkflowFeature } from "~/features/workflow/GetBoundWorkflow/feature.js";
import { ReadableBlockingReviewsFeature } from "~/features/workflow/ReadableBlockingReviews/feature.js";
import { ListReviewAssignmentsFeature } from "~/features/assignment/ListReviewAssignments/feature.js";
import { AssignmentSharedFeature } from "~/features/assignment/shared/feature.js";
import { RoutingEvaluatorFeature } from "~/features/routing/RoutingEvaluatorService/feature.js";
import { RoutingStrategyFeature } from "~/features/routing/RoutingStrategyService/feature.js";
import { InspectRoutingFeature } from "~/features/routing/InspectRouting/feature.js";
import { ListStepCandidatesFeature } from "~/features/routing/ListStepCandidates/feature.js";
import { WorkflowSettingsSharedFeature } from "~/features/settings/shared/feature.js";
import { GetWorkflowSettingsFeature } from "~/features/settings/GetWorkflowSettings/feature.js";
import { SaveWorkflowSettingsFeature } from "~/features/settings/SaveWorkflowSettings/feature.js";
import { GetWorkflowSettingsForEditorFeature } from "~/features/config/GetWorkflowSettingsForEditor/feature.js";
import { SaveWorkflowSettingsForEditorFeature } from "~/features/config/SaveWorkflowSettingsForEditor/feature.js";
import { ListAutomationDefinitionsFeature } from "~/features/config/ListAutomationDefinitions/feature.js";
import { ListWorkflowAiToolsFeature } from "~/features/config/ListWorkflowAiTools/feature.js";
import { ListWorkflowNotificationTransportsFeature } from "~/features/config/ListWorkflowNotificationTransports/feature.js";
import { ListWorkflowStepTypesFeature } from "~/features/config/ListWorkflowStepTypes/feature.js";
import { ListWorkflowUsersFeature } from "~/features/config/ListWorkflowUsers/feature.js";
import { ListWorkflowTeamsFeature } from "~/features/config/ListWorkflowTeams/feature.js";
import { CurrentUserTeamsFeature } from "~/features/identity/CurrentUserTeams/feature.js";
import { CurrentReviewViewerFeature } from "~/features/identity/CurrentReviewViewer/feature.js";
import { CandidateReadAccessFeature } from "~/features/identity/CandidateReadAccess/feature.js";
import { ReviewTeamLoaderFeature } from "~/features/identity/ReviewTeamLoader/feature.js";
import { WorkflowBypassServiceFeature } from "~/features/bypass/WorkflowBypassService/feature.js";
import { ReviewTaskAbortServiceFeature } from "~/features/stepRun/ReviewTaskAbortService/feature.js";
import { StepRunReachServiceFeature } from "~/features/stepRun/StepRunReachService/feature.js";
import { GetReviewStepRunFeature } from "~/features/stepRun/GetReviewStepRun/feature.js";
import { StepRunnerRegistryFeature } from "~/features/stepRun/StepRunnerRegistryService/feature.js";
import { StepRunStaleCheckFeature } from "~/features/stepRun/StepRunStaleCheckService/feature.js";
import { AutomationStepRunnerFeature } from "~/features/stepRun/AutomationStepRunner/feature.js";
import { WorkflowStepRunTaskFeature } from "~/features/stepRun/WorkflowStepRunTask/feature.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/WorkflowsPermissions/feature.js";
import { WorkflowEditorAccessFeature } from "~/features/permissions/WorkflowEditorAccess/feature.js";
import { AutomationDefinitionRegistryFeature } from "~/features/automation/AutomationDefinitionRegistryService/feature.js";
import { BuiltInAiToolsFeature } from "~/features/aiTools/BuiltInAiToolsFeature.js";
import { WorkflowAiToolRegistryFeature } from "~/features/aiTools/WorkflowAiToolRegistryService/feature.js";
import { StepTypesFeature } from "~/features/stepTypes/feature.js";
import { WorkflowModelFeature } from "~/features/model/feature.js";
import { WorkflowsSchemaFactory } from "~/graphql/WorkflowsSchemaFactory.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);
        container.register(ReviewModel);
        container.register(AssignmentModel);
        container.register(WorkflowSettingsModel);

        // Notifications (internal, no permission check, D133)
        ListNotificationTransportsFeature.register(container);
        NotificationTransportFeature.register(container);
        // Who is told about review events, and how (R182, R199)
        ReviewNotificationsFeature.register(container);

        // Workflow models, read by the parsers the app adapters register
        WorkflowModelFeature.register(container);

        // Step types (R131): the registry and the built-in review and automation types
        StepTypesFeature.register(container);
        // Automation definitions written by developers (R133); none ships (R155)
        AutomationDefinitionRegistryFeature.register(container);
        // AI tools an AI step may allowlist (R167)
        WorkflowAiToolRegistryFeature.register(container);
        // The built-in tools readTarget and updateTargetFields (R173)
        BuiltInAiToolsFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);

        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ReassignReviewStepFeature.register(container);
        RestartReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);
        // Stuck detection on single reads (R152)
        StuckStepFeature.register(container);

        // Target queries for the app target adapters and wrappers
        GetTargetReviewFeature.register(container);
        GetActiveTargetReviewFeature.register(container);
        ListTargetReviewsFeature.register(container);
        ListReviewsByTargetsFeature.register(container);
        // Team names of a review step's candidate teams (R208).
        ListReviewCandidateTeamsFeature.register(container);
        // Review lists for the app wrappers (spec 11)
        ListReviewsFeature.register(container);
        ListReviewedModelsFeature.register(container);
        DeleteTargetReviewsFeature.register(container);
        CancelTargetReviewsFeature.register(container);
        GetBoundWorkflowFeature.register(container);
        ReadableBlockingReviewsFeature.register(container);

        // Routing (spec 6): who gets a step when it is reached
        RoutingEvaluatorFeature.register(container);
        RoutingStrategyFeature.register(container);
        // Routing reads for the editor's inspector and the request and reassign dialogs (R120, R121)
        InspectRoutingFeature.register(container);
        ListStepCandidatesFeature.register(container);

        // Assignment log (written after each review save, R117; read by the get-review wrappers)
        AssignmentSharedFeature.register(container);
        ListReviewAssignmentsFeature.register(container);

        // Settings
        WorkflowSettingsSharedFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        SaveWorkflowSettingsFeature.register(container);

        // Shared configuration operations behind `editor` (D133 point 2, R97)
        GetWorkflowSettingsForEditorFeature.register(container);
        SaveWorkflowSettingsForEditorFeature.register(container);
        ListWorkflowStepTypesFeature.register(container);
        ListAutomationDefinitionsFeature.register(container);
        ListWorkflowAiToolsFeature.register(container);
        ListWorkflowNotificationTransportsFeature.register(container);
        ListWorkflowUsersFeature.register(container);
        ListWorkflowTeamsFeature.register(container);

        // Building blocks for the app wrappers (D132)
        WorkflowsPermissionsFeature.register(container);
        WorkflowEditorAccessFeature.register(container);
        CurrentUserTeamsFeature.register(container);
        CurrentReviewViewerFeature.register(container);
        CandidateReadAccessFeature.register(container);
        ReviewTeamLoaderFeature.register(container);

        // Bypass context for the automation run (D36, D62, R150); only the save block reads it
        WorkflowBypassServiceFeature.register(container);

        // Step run tasks (R142-R145): the abort service shared by the saver, the reach and cancel
        ReviewTaskAbortServiceFeature.register(container);
        StepRunReachServiceFeature.register(container);
        // The step runners the task dispatches to, and the built-in automation runner (R168)
        StepRunnerRegistryFeature.register(container);
        AutomationStepRunnerFeature.register(container);
        // The stored-review stale check for runners whose call outlives the run start (R175)
        StepRunStaleCheckFeature.register(container);
        // The private task that runs a workflow step (R142)
        WorkflowStepRunTaskFeature.register(container);
        // Reading the kept task of one step attempt for the app wrappers (R257, D161)
        GetReviewStepRunFeature.register(container);

        // GraphQL on /graphql: the `workflows` root and the shared types (R88, R100)
        container.register(WorkflowsSchemaFactory);
    }
});
