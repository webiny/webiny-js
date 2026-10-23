import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/api-graphql";
import { parseIdentifier } from "@webiny/utils";
import type { ReviewPick } from "@webiny/api-workflows/domain/review/types.js";
import {
    ReviewValidationError,
    type ReviewActiveOnTrashAction
} from "@webiny/api-workflows/domain/review/errors.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { isValidRevisionId } from "./isValidRevisionId.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowModelsUseCase } from "~/features/wrappers/ListCmsEntryWorkflowModels/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { GetCmsEntryReviewStepRunUseCase } from "~/features/wrappers/GetCmsEntryReviewStepRun/index.js";
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";
import { ListCmsEntryBlockingReviewsUseCase } from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { StartCmsEntryReviewStepUseCase } from "~/features/wrappers/StartCmsEntryReviewStep/index.js";
import { TakeOverCmsEntryReviewStepUseCase } from "~/features/wrappers/TakeOverCmsEntryReviewStep/index.js";
import { ApproveCmsEntryReviewStepUseCase } from "~/features/wrappers/ApproveCmsEntryReviewStep/index.js";
import { RejectCmsEntryReviewStepUseCase } from "~/features/wrappers/RejectCmsEntryReviewStep/index.js";
import { CancelCmsEntryReviewUseCase } from "~/features/wrappers/CancelCmsEntryReview/index.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";
import { ReassignCmsEntryReviewStepUseCase } from "~/features/wrappers/ReassignCmsEntryReviewStep/index.js";
import { RestartCmsEntryReviewStepUseCase } from "~/features/wrappers/RestartCmsEntryReviewStep/index.js";
import { ListCmsEntryStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryStepCandidates/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryReviewStepCandidates/index.js";
import { InspectCmsEntryRoutingUseCase } from "~/features/wrappers/InspectCmsEntryRouting/index.js";
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";

interface StoreCmsEntryWorkflowArgs {
    data: WorkflowValues;
    /** The `savedOn` the editor loaded (D131); a string, not `DateTime` (R104). */
    savedOn?: string | null;
}

interface GetCmsEntryTargetReviewArgs {
    modelId: string;
    revisionId: string;
}

interface RequestCmsEntryReviewArgs {
    modelId: string;
    revisionId: string;
    title?: string | null;
    picks?: ReviewPick[] | null;
}

interface CancelCmsEntryReviewsForDeleteArgs {
    modelId: string;
    entryId: string;
    revisionId?: string | null;
    action: ReviewActiveOnTrashAction;
}

interface ListCmsEntryStepCandidatesArgs {
    workflowId: string;
    stepId: string;
    modelId: string;
    revisionId: string;
}

interface InspectCmsEntryRoutingArgs {
    /** The unsaved step config (`JSON`); the engine validates it. */
    stepConfig: unknown;
    modelId: string;
    requesterId: string;
    /** Missing or `null`: the root folder. */
    folderId?: string | null;
}

/**
 * CMS envelopes, inputs and root fields. Every other type is a shared `Workflows*` type of the
 * api-workflows schema (R100), built into the same `/graphql` document.
 */
const CMS_WORKFLOWS_TYPE_DEFS = /* GraphQL */ `
    type CmsEntryWorkflowResponse {
        data: WorkflowsWorkflow
        error: WorkflowsError
    }

    type CmsEntryWorkflowListResponse {
        data: [WorkflowsWorkflow!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type CmsEntryReviewResponse {
        data: WorkflowsReview
        error: WorkflowsError
    }

    type CmsEntryReviewArrayResponse {
        data: [WorkflowsReview!]
        error: WorkflowsError
    }

    type CmsEntryReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }

    type CmsEntryReviewStepRunResponse {
        data: WorkflowsStepRunInfo
        error: WorkflowsError
    }

    type CmsEntryReviewListResponse {
        data: [WorkflowsReviewWithFlags!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type CmsEntryBlockingReviewsResponse {
        data: [WorkflowsBlockingReview!]
        error: WorkflowsError
    }

    type CmsEntryWorkflowModelWorkflow {
        id: ID!
        name: String!
    }

    type CmsEntryWorkflowModel {
        "Namespace id, cms.<modelId>, as a workflow's models hold it."
        model: String!
        modelId: String!
        name: String!
        workflow: CmsEntryWorkflowModelWorkflow
    }

    type CmsEntryWorkflowModelListResponse {
        data: [CmsEntryWorkflowModel!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type CmsEntryStepCandidateListResponse {
        data: [WorkflowsStepCandidate!]
        error: WorkflowsError
    }

    input CmsEntryReviewListWhere {
        "The model id, without the cms. prefix (R94)."
        modelId: String
        titleContains: String
        "My requests only (R91)."
        reviewState: WorkflowsReviewState
        "My requests only (R91)."
        stepState: WorkflowsStepState
    }

    type CmsEntryRoutingInspectionResponse {
        data: WorkflowsRoutingInspection
        error: WorkflowsError
    }

    extend type CmsQuery {
        listCmsEntryWorkflows: CmsEntryWorkflowListResponse!
        getCmsEntryWorkflow(id: ID!): CmsEntryWorkflowResponse!
        getCmsEntryReview(id: ID!): CmsEntryReviewWithFlagsResponse!
        getCmsEntryTargetReview(modelId: ID!, revisionId: ID!): CmsEntryReviewWithFlagsResponse!
        "The background task of one step attempt; needs workflows editor or reassign (R258). data is null when the task is gone."
        getCmsEntryReviewStepRun(
            reviewId: ID!
            stepId: ID!
            taskId: ID!
        ): CmsEntryReviewStepRunResponse!
        listCmsEntryReviews(
            list: WorkflowsReviewListKind!
            where: CmsEntryReviewListWhere
            sort: WorkflowsReviewListSort
            limit: Int
            after: String
        ): CmsEntryReviewListResponse!
        listCmsEntryBlockingReviews(
            modelId: ID!
            entryIds: [ID!]!
        ): CmsEntryBlockingReviewsResponse!
        listCmsEntryWorkflowModels(
            search: String
            limit: Int
            after: String
        ): CmsEntryWorkflowModelListResponse!
        listCmsEntryStepCandidates(
            workflowId: ID!
            stepId: ID!
            modelId: ID!
            revisionId: ID!
        ): CmsEntryStepCandidateListResponse!
        listCmsEntryReviewStepCandidates(
            reviewId: ID!
            stepId: ID!
        ): CmsEntryStepCandidateListResponse!
        inspectCmsEntryRouting(
            stepConfig: JSON!
            modelId: ID!
            requesterId: ID!
            folderId: ID
        ): CmsEntryRoutingInspectionResponse!
        cmsEntryFolderExists(id: ID!, type: String!): WorkflowsBooleanResponse!
    }

    extend type CmsMutation {
        storeCmsEntryWorkflow(
            data: WorkflowsWorkflowInput!
            savedOn: String
        ): CmsEntryWorkflowResponse!
        deleteCmsEntryWorkflow(id: ID!): CmsEntryWorkflowResponse!
        requestCmsEntryReview(
            modelId: ID!
            revisionId: ID!
            title: String
            picks: [WorkflowsReviewPickInput!]
        ): CmsEntryReviewResponse!
        startCmsEntryReviewStep(reviewId: ID!, stepId: ID!): CmsEntryReviewResponse!
        takeOverCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            notifyPreviousOwner: Boolean = true
        ): CmsEntryReviewResponse!
        reassignCmsEntryReviewStep(reviewId: ID!, stepId: ID!, userId: ID!): CmsEntryReviewResponse!
        restartCmsEntryReviewStep(reviewId: ID!, stepId: ID!): CmsEntryReviewResponse!
        approveCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): CmsEntryReviewResponse!
        rejectCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): CmsEntryReviewResponse!
        cancelCmsEntryReview(reviewId: ID!): CmsEntryReviewResponse!
        cancelCmsEntryReviewsForDelete(
            modelId: ID!
            entryId: ID!
            revisionId: ID
            action: WorkflowsReviewsForDeleteAction!
        ): CmsEntryReviewArrayResponse!
    }
`;

/**
 * Headless CMS workflow and review operations on the `cms` root of `/graphql` (R88, D136). Each
 * resolver calls its wrapper use case inline (D132); the wrappers check identity, permissions and
 * target access. Registered only with the `advancedPublishingWorkflow` license (R100).
 */
class CmsWorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey(
        "api-headless-cms-workflows/CmsWorkflowsSchemaFactoryImpl"
    );

    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(CMS_WORKFLOWS_TYPE_DEFS);

        // Workflows
        builder.addResolver({
            path: "CmsQuery.listCmsEntryWorkflows",
            dependencies: [ListCmsEntryWorkflowsUseCase, Logger],
            resolver: (
                listWorkflows: ListCmsEntryWorkflowsUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async () => {
                    const result = await listWorkflows.execute();
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ListErrorResponse(result.error);
                    }
                    // Unpaged (R59): one page with every CMS workflow.
                    return new ListResponse(result.value, { cursor: null, hasMoreItems: false });
                };
            }
        });

        builder.addResolver<GetCmsEntryWorkflowUseCase.Input>({
            path: "CmsQuery.getCmsEntryWorkflow",
            dependencies: [GetCmsEntryWorkflowUseCase, Logger],
            resolver: (
                getWorkflow: GetCmsEntryWorkflowUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await getWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<StoreCmsEntryWorkflowArgs>({
            path: "CmsMutation.storeCmsEntryWorkflow",
            dependencies: [StoreCmsEntryWorkflowUseCase, Logger],
            resolver: (
                storeWorkflow: StoreCmsEntryWorkflowUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await storeWorkflow.execute({
                        workflow: args.data,
                        savedOn: args.savedOn
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<DeleteCmsEntryWorkflowUseCase.Input>({
            path: "CmsMutation.deleteCmsEntryWorkflow",
            dependencies: [DeleteCmsEntryWorkflowUseCase, Logger],
            resolver: (
                deleteWorkflow: DeleteCmsEntryWorkflowUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await deleteWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListCmsEntryWorkflowModelsUseCase.Input>({
            path: "CmsQuery.listCmsEntryWorkflowModels",
            dependencies: [ListCmsEntryWorkflowModelsUseCase, Logger],
            resolver: (
                listModels: ListCmsEntryWorkflowModelsUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await listModels.execute({
                        search: args.search,
                        limit: args.limit,
                        after: args.after
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        // Review reads
        builder.addResolver<GetCmsEntryReviewUseCase.Input>({
            path: "CmsQuery.getCmsEntryReview",
            dependencies: [GetCmsEntryReviewUseCase, Logger],
            resolver: (getReview: GetCmsEntryReviewUseCase.Interface, logger: Logger.Interface) => {
                return async ({ args }) => {
                    const result = await getReview.execute({ id: args.id });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<GetCmsEntryReviewStepRunUseCase.Input>({
            path: "CmsQuery.getCmsEntryReviewStepRun",
            dependencies: [GetCmsEntryReviewStepRunUseCase, Logger],
            resolver: (
                getStepRun: GetCmsEntryReviewStepRunUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await getStepRun.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        taskId: args.taskId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<GetCmsEntryTargetReviewArgs>({
            path: "CmsQuery.getCmsEntryTargetReview",
            dependencies: [GetCmsEntryTargetReviewUseCase, Logger],
            resolver: (
                getTargetReview: GetCmsEntryTargetReviewUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    // A malformed revision id is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await getTargetReview.execute({
                        model: toCmsNamespace(args.modelId),
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListCmsEntryReviewsUseCase.Input>({
            path: "CmsQuery.listCmsEntryReviews",
            dependencies: [ListCmsEntryReviewsUseCase, Logger],
            resolver: (
                listReviews: ListCmsEntryReviewsUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await listReviews.execute({
                        list: args.list,
                        where: args.where,
                        sort: args.sort,
                        limit: args.limit,
                        after: args.after
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver<ListCmsEntryBlockingReviewsUseCase.Input>({
            path: "CmsQuery.listCmsEntryBlockingReviews",
            dependencies: [ListCmsEntryBlockingReviewsUseCase, Logger],
            resolver: (
                listBlockingReviews: ListCmsEntryBlockingReviewsUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await listBlockingReviews.execute({
                        modelId: args.modelId,
                        entryIds: args.entryIds
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        // Review actions
        builder.addResolver<RequestCmsEntryReviewArgs>({
            path: "CmsMutation.requestCmsEntryReview",
            dependencies: [RequestCmsEntryReviewUseCase, Logger],
            resolver: (
                requestReview: RequestCmsEntryReviewUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    // The entry id comes from the revision id, `<entryId>#<version>` (R88); a
                    // malformed one is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await requestReview.execute({
                        model: toCmsNamespace(args.modelId),
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId,
                        title: args.title,
                        picks: args.picks ?? undefined
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<StartCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.startCmsEntryReviewStep",
            dependencies: [StartCmsEntryReviewStepUseCase, Logger],
            resolver: (
                startStep: StartCmsEntryReviewStepUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await startStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<TakeOverCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.takeOverCmsEntryReviewStep",
            dependencies: [TakeOverCmsEntryReviewStepUseCase, Logger],
            resolver: (
                takeOverStep: TakeOverCmsEntryReviewStepUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await takeOverStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        notifyPreviousOwner: args.notifyPreviousOwner
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ReassignCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.reassignCmsEntryReviewStep",
            dependencies: [ReassignCmsEntryReviewStepUseCase, Logger],
            resolver: (
                reassignStep: ReassignCmsEntryReviewStepUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await reassignStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        userId: args.userId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<RestartCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.restartCmsEntryReviewStep",
            dependencies: [RestartCmsEntryReviewStepUseCase, Logger],
            resolver: (
                restartStep: RestartCmsEntryReviewStepUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await restartStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ApproveCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.approveCmsEntryReviewStep",
            dependencies: [ApproveCmsEntryReviewStepUseCase, Logger],
            resolver: (
                approveStep: ApproveCmsEntryReviewStepUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await approveStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<RejectCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.rejectCmsEntryReviewStep",
            dependencies: [RejectCmsEntryReviewStepUseCase, Logger],
            resolver: (
                rejectStep: RejectCmsEntryReviewStepUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await rejectStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelCmsEntryReviewUseCase.Input>({
            path: "CmsMutation.cancelCmsEntryReview",
            dependencies: [CancelCmsEntryReviewUseCase, Logger],
            resolver: (
                cancelReview: CancelCmsEntryReviewUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await cancelReview.execute({ reviewId: args.reviewId });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelCmsEntryReviewsForDeleteArgs>({
            path: "CmsMutation.cancelCmsEntryReviewsForDelete",
            dependencies: [CancelCmsEntryReviewsForDeleteUseCase, Logger],
            resolver: (
                cancelForDelete: CancelCmsEntryReviewsForDeleteUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    // A given revision id must be well formed (R107).
                    if (
                        args.revisionId !== null &&
                        args.revisionId !== undefined &&
                        !isValidRevisionId(args.revisionId)
                    ) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await cancelForDelete.execute({
                        model: toCmsNamespace(args.modelId),
                        targetId: args.entryId,
                        targetRevisionId: args.revisionId,
                        action: args.action
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        // Routing (R120, R121, R124, R125)
        builder.addResolver<ListCmsEntryStepCandidatesArgs>({
            path: "CmsQuery.listCmsEntryStepCandidates",
            dependencies: [ListCmsEntryStepCandidatesUseCase, Logger],
            resolver: (
                listCandidates: ListCmsEntryStepCandidatesUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    // A malformed revision id is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await listCandidates.execute({
                        workflowId: args.workflowId,
                        stepId: args.stepId,
                        model: toCmsNamespace(args.modelId),
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListCmsEntryReviewStepCandidatesUseCase.Input>({
            path: "CmsQuery.listCmsEntryReviewStepCandidates",
            dependencies: [ListCmsEntryReviewStepCandidatesUseCase, Logger],
            resolver: (
                listCandidates: ListCmsEntryReviewStepCandidatesUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await listCandidates.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<InspectCmsEntryRoutingArgs>({
            path: "CmsQuery.inspectCmsEntryRouting",
            dependencies: [InspectCmsEntryRoutingUseCase, Logger],
            resolver: (
                inspectRouting: InspectCmsEntryRoutingUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await inspectRouting.execute({
                        stepConfig: args.stepConfig,
                        model: toCmsNamespace(args.modelId),
                        requesterId: args.requesterId,
                        folderId: args.folderId
                    });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CmsEntryFolderExistsUseCase.Input>({
            path: "CmsQuery.cmsEntryFolderExists",
            dependencies: [CmsEntryFolderExistsUseCase, Logger],
            resolver: (
                folderExists: CmsEntryFolderExistsUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ args }) => {
                    const result = await folderExists.execute({ id: args.id, type: args.type });
                    if (result.isFail()) {
                        if (hasErrorSource(result.error)) {
                            logger.error({ err: result.error.source }, result.error.message);
                        }
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const CmsWorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: CmsWorkflowsSchemaFactoryImpl,
    dependencies: []
});
