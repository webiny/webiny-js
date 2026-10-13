import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { ErrorResponse, Response } from "@webiny/api-graphql";
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";
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
        assignedOn: DateTime!
        source: String!
        by: WorkflowsActor
        reason: String
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
        assignmentSource: String
        assignment: WorkflowsReviewStepAssignment
        reachedOn: DateTime
        startedOn: DateTime
        finishedOn: DateTime
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

    type WorkflowsQuery {
        getSettings(includeExpired: Boolean): WorkflowsSettingsResponse!
        listStepTypes: WorkflowsStepTypeListResponse!
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
