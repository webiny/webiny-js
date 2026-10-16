import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { ErrorResponse, Response } from "@webiny/api-graphql";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";
import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomationDefinitions/index.js";
import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";
import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
import type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";

interface GetSettingsArgs {
    includeExpired?: boolean | null;
}

interface ExclusionInputArgs {
    userId: string;
    reason?: string | null;
    endsOn?: string | null;
}

interface SettingsInputArgs {
    exclusions: ExclusionInputArgs[];
}

interface UpdateSettingsArgs {
    data: SettingsInputArgs;
}

interface CandidateTeamsParent {
    candidateTeamIds?: string[] | null;
}

interface CandidateTeamsResolverArgs {
    parent: CandidateTeamsParent;
}

interface AssignmentUserNameParent {
    userId?: string | null;
}

interface AssignmentUserNameResolverArgs {
    parent: AssignmentUserNameParent;
}

interface ListUsersArgs {
    search?: string | null;
    ids?: string[] | null;
    limit?: number | null;
}

/** GraphQL sends `null` for omitted optional input fields; the engine types use absent keys. */
const toWorkflowSettings = (input: SettingsInputArgs): WorkflowSettings => {
    return {
        exclusions: input.exclusions.map((exclusion): WorkflowExclusion => {
            return {
                userId: exclusion.userId,
                ...(exclusion.reason ? { reason: exclusion.reason } : {}),
                ...(exclusion.endsOn ? { endsOn: exclusion.endsOn } : {})
            };
        })
    };
};

/**
 * The shared types every workflows schema reuses (R100). The CMS and Website Builder factories
 * reference them by name and add only their envelopes and root fields; all factories build into
 * one `/graphql` type document, so the order of registration does not matter.
 */
const SHARED_TYPE_DEFS = /* GraphQL */ `
    type WorkflowsError {
        code: String
        message: String
        data: JSON
        stack: String
    }

    type WorkflowsListMeta {
        cursor: String
        hasMoreItems: Boolean!
    }

    type WorkflowsBooleanResponse {
        data: Boolean
        error: WorkflowsError
    }

    type WorkflowsActor {
        type: String!
        id: ID!
        displayName: String!
        identityType: String
    }

    "A user as the workflows screens see one (D104): no email, roles or teams."
    type WorkflowsUser {
        id: ID!
        displayName: String!
    }

    "A team as the review screens name one (R208): id and name only."
    type WorkflowsTeam {
        id: ID!
        name: String!
    }

    "A member of a step's teams (R120). excludedReason is null unless the viewer has editor or reassign (D97)."
    type WorkflowsStepCandidate {
        id: ID!
        displayName: String!
        excluded: Boolean!
        excludedReason: String
    }

    enum WorkflowsRoutingTraceOutcome {
        matched
        notMatched
        skipped
    }

    type WorkflowsRoutingTraceEntry {
        ruleId: String!
        outcome: WorkflowsRoutingTraceOutcome!
        reason: String
    }

    "A person routing skipped (R129, D118). displayName is null for a user outside the step's teams."
    type WorkflowsRoutingSkip {
        userId: ID!
        displayName: String
        reason: String!
    }

    "What routing would do with an unsaved step config (R121, D45, D118). No load numbers (D104)."
    type WorkflowsRoutingInspection {
        owner: WorkflowsUser
        source: String!
        ruleId: String
        "The step's configured strategy."
        strategy: String!
        trace: [WorkflowsRoutingTraceEntry!]!
        skipped: [WorkflowsRoutingSkip!]!
    }

    type WorkflowsStepNotification {
        id: String!
    }

    type WorkflowsStep {
        id: ID!
        title: String!
        color: String!
        description: String
        type: String!
        notifications: [WorkflowsStepNotification!]!
        config: JSON
    }

    type WorkflowsWorkflow {
        id: ID!
        name: String!
        models: [String!]!
        steps: [WorkflowsStep!]!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: WorkflowsActor!
        savedBy: WorkflowsActor!
    }

    input WorkflowsStepNotificationInput {
        id: String!
    }

    input WorkflowsStepInput {
        id: ID!
        title: String!
        color: String!
        description: String
        type: String!
        notifications: [WorkflowsStepNotificationInput!]!
        config: JSON
    }

    input WorkflowsWorkflowInput {
        id: ID!
        name: String!
        models: [String!]!
        steps: [WorkflowsStepInput!]!
    }

    enum WorkflowsReviewState {
        inProgress
        approved
        rejected
        cancelled
    }

    enum WorkflowsStepState {
        pending
        awaiting
        inReview
        approved
        rejected
        failed
    }

    enum WorkflowsAssignmentKind {
        outcome
        skip
    }

    type WorkflowsReviewStepAssignment {
        source: String!
        ruleId: String
        reason: String
        by: WorkflowsActor
    }

    type WorkflowsAssignmentEntry {
        id: ID!
        kind: WorkflowsAssignmentKind!
        userId: String
        "The display name of the user (R251). Null when the entry has no user, the user no longer exists or the name could not be read."
        userDisplayName: String
        assignedOn: DateTime!
        source: String!
        "The rule that decided or was skipped (R109)."
        ruleId: String
        by: WorkflowsActor
        reason: String
    }

    type WorkflowsStepRun {
        "The earlier attempt's background task id; null when its reach failed before a task started."
        taskId: String
        startedOn: DateTime!
        finishedOn: DateTime
        "approved, rejected or failed."
        outcome: String
        reason: String
    }

    type WorkflowsAiIssue {
        "A dotted path into the target; null when the finding is about the whole target."
        fieldPath: String
        "error, warning or info."
        severity: String!
        message: String!
        suggestion: String
    }

    type WorkflowsReviewStep {
        id: ID!
        title: String!
        color: String!
        description: String
        type: String!
        notifications: [WorkflowsStepNotification!]!
        config: JSON
        state: WorkflowsStepState!
        owner: WorkflowsActor
        comment: String
        pickedUserId: String
        candidateTeamIds: [String!]!
        "The candidate teams by name (R208). A team that no longer exists is left out; an empty list when the names could not be read."
        candidateTeams: [WorkflowsTeam!]!
        assignmentSource: String
        assignment: WorkflowsReviewStepAssignment
        reachedOn: DateTime
        startedOn: DateTime
        finishedOn: DateTime
        "The current attempt's background task id (D57); null on a review step and before an automation starts."
        taskId: String
        "Earlier attempts of the step, oldest first (D82)."
        runs: [WorkflowsStepRun!]!
        "The findings of an AI decision (R171); empty for every other step."
        issues: [WorkflowsAiIssue!]!
        "Assignment-log entries of this step, newest first (D127). Only on a single review read; skip entries need editor or reassign (D89)."
        assignments: [WorkflowsAssignmentEntry!]
    }

    type WorkflowsReviewTargetFolder {
        id: ID!
        type: String!
    }

    type WorkflowsReviewTargetAuthor {
        id: ID!
        displayName: String!
    }

    type WorkflowsReviewTargetContext {
        folder: WorkflowsReviewTargetFolder
        modelId: String!
        title: String!
        author: WorkflowsReviewTargetAuthor!
    }

    type WorkflowsReviewWorkflow {
        name: String!
        models: [String!]!
    }

    type WorkflowsReview {
        id: ID!
        workflowId: ID!
        model: String!
        targetId: ID!
        targetRevisionId: ID!
        title: String!
        isActive: Boolean!
        state: WorkflowsReviewState!
        currentStepId: String
        currentStepState: WorkflowsStepState
        currentStepType: String
        currentOwnerId: String
        currentCandidateTeamIds: [String!]!
        targetContext: WorkflowsReviewTargetContext!
        workflow: WorkflowsReviewWorkflow!
        steps: [WorkflowsReviewStep!]!
        "The requester."
        createdBy: WorkflowsActor!
        "Who cancelled the review (R252). Null unless the review is cancelled, and for reviews cancelled before this was recorded."
        cancelledBy: WorkflowsActor
        createdOn: DateTime!
        savedOn: DateTime!
        lastChangedOn: DateTime!
    }

    type WorkflowsViewerFlags {
        canStart: Boolean!
        canTakeOver: Boolean!
        canApprove: Boolean!
        canReject: Boolean!
        canCancel: Boolean!
        canReassign: Boolean!
        canRestart: Boolean!
    }

    type WorkflowsReviewWithFlags {
        review: WorkflowsReview!
        flags: WorkflowsViewerFlags!
    }

    enum WorkflowsReviewListKind {
        assignedToMe
        pool
        teamInReview
        myRequests
        failedSteps
    }

    enum WorkflowsReviewListSort {
        lastChangedOn_ASC
        lastChangedOn_DESC
    }

    input WorkflowsReviewListWhere {
        "CMS only: the model id, without the cms. prefix (R94)."
        modelId: String
        titleContains: String
        "My requests only (R91)."
        reviewState: WorkflowsReviewState
        "My requests only (R91)."
        stepState: WorkflowsStepState
    }

    input WorkflowsReviewPickInput {
        stepId: String!
        userId: String!
    }

    enum WorkflowsReviewsForDeleteAction {
        trash
        delete
    }
`;

const ROOT_TYPE_DEFS = /* GraphQL */ `
    type WorkflowsExclusion {
        userId: String!
        reason: String
        endsOn: DateTime
    }

    type WorkflowsSettings {
        exclusions: [WorkflowsExclusion!]!
    }

    type WorkflowsSettingsResponse {
        data: WorkflowsSettings
        error: WorkflowsError
    }

    input WorkflowsExclusionInput {
        userId: String!
        reason: String
        "ISO datetime in UTC."
        endsOn: String
    }

    input WorkflowsSettingsInput {
        exclusions: [WorkflowsExclusionInput!]!
    }

    type WorkflowsStepType {
        type: String!
        title: String!
        available: Boolean!
        unavailableReason: String
        "JSON schema of the step config; null when the type has no editable config."
        configSchema: JSON
    }

    type WorkflowsStepTypeListResponse {
        data: [WorkflowsStepType!]
        error: WorkflowsError
    }

    type WorkflowsAutomationDefinition {
        id: String!
        name: String!
        "Where it may be used: '*', '<app>.*' or exact namespace ids (D35)."
        models: [String!]!
        "JSON schema of the settings the workflow author fills in when adding the step."
        settingsSchema: JSON
    }

    type WorkflowsAutomationDefinitionListResponse {
        data: [WorkflowsAutomationDefinition!]
        error: WorkflowsError
    }

    type WorkflowsAiTool {
        "The name a step stores in its tool allowlist."
        name: String!
        title: String!
        "What the tool does; the model reads the same text."
        description: String!
    }

    type WorkflowsAiToolListResponse {
        data: [WorkflowsAiTool!]
        error: WorkflowsError
    }

    type WorkflowsNotificationTransport {
        "The id a step stores in its notifications."
        id: ID!
        title: String!
        "What the transport does; null when it has no description."
        description: String
    }

    type WorkflowsNotificationTransportListResponse {
        data: [WorkflowsNotificationTransport!]
        error: WorkflowsError
    }

    type WorkflowsUserListResult {
        users: [WorkflowsUser!]!
        "Requested ids with no user (D117); empty for a search."
        missingIds: [String!]!
    }

    type WorkflowsUserListResponse {
        data: WorkflowsUserListResult
        error: WorkflowsError
    }

    type WorkflowsQuery {
        getSettings(includeExpired: Boolean): WorkflowsSettingsResponse!
        listStepTypes: WorkflowsStepTypeListResponse!
        listAutomationDefinitions: WorkflowsAutomationDefinitionListResponse!
        listAiTools: WorkflowsAiToolListResponse!
        listNotificationTransports: WorkflowsNotificationTransportListResponse!
        "Search by display name or email (limit 50 by default, at most 200), or look up ids (D117)."
        listUsers(search: String, ids: [String!], limit: Int): WorkflowsUserListResponse!
    }

    type WorkflowsMutation {
        updateSettings(data: WorkflowsSettingsInput!): WorkflowsSettingsResponse!
    }

    extend type Query {
        workflows: WorkflowsQuery!
    }

    extend type Mutation {
        workflows: WorkflowsMutation!
    }
`;

/**
 * The `workflows` root on `/graphql` (R88) and the shared workflows types (R100). Registered only
 * when `advancedPublishingWorkflow` is licensed (`WorkflowsFeature` gates at register time), so no
 * per-request license guard is needed. Resolvers call only the shared configuration use cases
 * (R97, D132); the `editor` check lives there.
 */
class WorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(SHARED_TYPE_DEFS);
        builder.addTypeDefs(ROOT_TYPE_DEFS);

        // Never fails the read: a review is readable without the team names (R87, R208).
        builder.addResolver({
            path: "WorkflowsReviewStep.candidateTeams",
            dependencies: [ListReviewCandidateTeamsUseCase, Logger],
            resolver: (
                listTeams: ListReviewCandidateTeamsUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ parent }: CandidateTeamsResolverArgs) => {
                    try {
                        const result = await listTeams.execute({
                            teamIds: parent.candidateTeamIds ?? []
                        });
                        if (result.isFail()) {
                            // The use case logged the failure.
                            return [];
                        }
                        return result.value;
                    } catch (error) {
                        logger.error(
                            { error },
                            "Could not resolve the candidate teams of a review step."
                        );
                        return [];
                    }
                };
            }
        });

        // Never fails the read: a review is readable without the names of skipped users (R87, R251).
        builder.addResolver({
            path: "WorkflowsAssignmentEntry.userDisplayName",
            dependencies: [ResolveReviewUserNameUseCase, Logger],
            resolver: (
                resolveName: ResolveReviewUserNameUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ parent }: AssignmentUserNameResolverArgs) => {
                    if (!parent.userId) {
                        return null;
                    }
                    try {
                        const result = await resolveName.execute({ userId: parent.userId });
                        if (result.isFail()) {
                            // The use case logged the failure.
                            return null;
                        }
                        return result.value;
                    } catch (error) {
                        logger.error(
                            { error },
                            "Could not resolve the display name of a skipped user."
                        );
                        return null;
                    }
                };
            }
        });

        builder.addResolver({
            path: "Query.workflows",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.workflows",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<GetSettingsArgs>({
            path: "WorkflowsQuery.getSettings",
            dependencies: [GetWorkflowSettingsForEditorUseCase],
            resolver: (getSettings: GetWorkflowSettingsForEditorUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getSettings.execute({
                        includeExpired: args.includeExpired === true
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "WorkflowsQuery.listStepTypes",
            dependencies: [ListWorkflowStepTypesUseCase],
            resolver: (listStepTypes: ListWorkflowStepTypesUseCase.Interface) => {
                return async () => {
                    const result = await listStepTypes.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "WorkflowsQuery.listAutomationDefinitions",
            dependencies: [ListAutomationDefinitionsUseCase],
            resolver: (listAutomations: ListAutomationDefinitionsUseCase.Interface) => {
                return async () => {
                    const result = await listAutomations.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "WorkflowsQuery.listAiTools",
            dependencies: [ListWorkflowAiToolsUseCase],
            resolver: (listAiTools: ListWorkflowAiToolsUseCase.Interface) => {
                return async () => {
                    const result = await listAiTools.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "WorkflowsQuery.listNotificationTransports",
            dependencies: [ListWorkflowNotificationTransportsUseCase],
            resolver: (listTransports: ListWorkflowNotificationTransportsUseCase.Interface) => {
                return async () => {
                    const result = await listTransports.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListUsersArgs>({
            path: "WorkflowsQuery.listUsers",
            dependencies: [ListWorkflowUsersUseCase],
            resolver: (listUsers: ListWorkflowUsersUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listUsers.execute({
                        search: args.search,
                        ids: args.ids,
                        limit: args.limit
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<UpdateSettingsArgs>({
            path: "WorkflowsMutation.updateSettings",
            dependencies: [SaveWorkflowSettingsForEditorUseCase],
            resolver: (saveSettings: SaveWorkflowSettingsForEditorUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await saveSettings.execute(toWorkflowSettings(args.data));
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const WorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WorkflowsSchemaFactoryImpl,
    dependencies: []
});
