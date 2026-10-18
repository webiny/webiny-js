import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/api-graphql";
import { parseIdentifier } from "@webiny/utils";
import type { ReviewPick } from "@webiny/api-workflows/domain/review/types.js";
import {
    ReviewValidationError,
    type ReviewActiveOnTrashAction
} from "@webiny/api-workflows/domain/review/errors.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { isValidRevisionId } from "./isValidRevisionId.js";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageWorkflows/index.js";
import { GetWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/GetWebsiteBuilderPageWorkflow/index.js";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js";
import { ListWebsiteBuilderPageReviewsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/StartWebsiteBuilderPageReviewStep/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.js";
import { CancelWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReview/index.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js";
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js";
import { RestartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.js";
import { InspectWebsiteBuilderPageRoutingUseCase } from "~/features/wrappers/InspectWebsiteBuilderPageRouting/index.js";
import { WebsiteBuilderPageFolderExistsUseCase } from "~/features/wrappers/WebsiteBuilderPageFolderExists/index.js";

interface StoreWebsiteBuilderPageWorkflowArgs {
    data: WorkflowValues;
    /** The `savedOn` the editor loaded (D131); a string, not `DateTime` (R104). */
    savedOn?: string | null;
}

interface GetWebsiteBuilderPageTargetReviewArgs {
    revisionId: string;
}

interface RequestWebsiteBuilderPageReviewArgs {
    /** `<pageId>#<version>`; the page id is parsed from it (R88). */
    revisionId: string;
    title?: string | null;
    picks?: ReviewPick[] | null;
}

interface CancelWebsiteBuilderPageReviewsForDeleteArgs {
    pageId: string;
    revisionId?: string | null;
    action: ReviewActiveOnTrashAction;
}

interface ListWebsiteBuilderPageStepCandidatesArgs {
    workflowId: string;
    stepId: string;
    /** `<pageId>#<version>`; the page id is parsed from it (R88). */
    revisionId: string;
}

/**
 * Website Builder envelopes, its list filter and root fields. Every other type is a shared
 * `Workflows*` type of the api-workflows schema (R100), built into the same `/graphql` document.
 * `WbPageReviewListWhere` has no `modelId`: the WB list covers `wb.page` only.
 */
const WB_WORKFLOWS_TYPE_DEFS = /* GraphQL */ `
    type WbPageWorkflowResponse {
        data: WorkflowsWorkflow
        error: WorkflowsError
    }

    type WbPageWorkflowListResponse {
        data: [WorkflowsWorkflow!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type WbPageReviewResponse {
        data: WorkflowsReview
        error: WorkflowsError
    }

    type WbPageReviewArrayResponse {
        data: [WorkflowsReview!]
        error: WorkflowsError
    }

    type WbPageReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }

    type WbPageReviewStepRunResponse {
        data: WorkflowsStepRunInfo
        error: WorkflowsError
    }

    type WbPageReviewListResponse {
        data: [WorkflowsReviewWithFlags!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type WbPageStepCandidateListResponse {
        data: [WorkflowsStepCandidate!]
        error: WorkflowsError
    }

    type WbPageRoutingInspectionResponse {
        data: WorkflowsRoutingInspection
        error: WorkflowsError
    }

    input WbPageReviewListWhere {
        titleContains: String
        "My requests only (R91)."
        reviewState: WorkflowsReviewState
        "My requests only (R91)."
        stepState: WorkflowsStepState
    }

    extend type WbQuery {
        listWebsiteBuilderPageWorkflows: WbPageWorkflowListResponse!
        getWebsiteBuilderPageWorkflow(id: ID!): WbPageWorkflowResponse!
        getWebsiteBuilderPageReview(id: ID!): WbPageReviewWithFlagsResponse!
        "The active review of a page revision; data is null when it has none."
        getWebsiteBuilderPageTargetReview(revisionId: ID!): WbPageReviewWithFlagsResponse!
        "The background task of one step attempt; needs workflows editor or reassign (R258). data is null when the task is gone."
        getWebsiteBuilderPageReviewStepRun(
            reviewId: ID!
            stepId: ID!
            taskId: ID!
        ): WbPageReviewStepRunResponse!
        listWebsiteBuilderPageReviews(
            list: WorkflowsReviewListKind!
            where: WbPageReviewListWhere
            sort: WorkflowsReviewListSort
            limit: Int
            after: String
        ): WbPageReviewListResponse!
        "Who could take a step of a review of this page revision (request dialog, R120)."
        listWebsiteBuilderPageStepCandidates(
            workflowId: ID!
            stepId: ID!
            revisionId: ID!
        ): WbPageStepCandidateListResponse!
        "Who a review step can be reassigned to (R120)."
        listWebsiteBuilderPageReviewStepCandidates(
            reviewId: ID!
            stepId: ID!
        ): WbPageStepCandidateListResponse!
        "folderId: a page folder; omitted or null is the root (R121)."
        inspectWebsiteBuilderPageRouting(
            stepConfig: JSON!
            requesterId: ID!
            folderId: ID
        ): WbPageRoutingInspectionResponse!
        "Whether a page folder still exists; the answer only (D69)."
        websiteBuilderPageFolderExists(id: ID!): WorkflowsBooleanResponse!
    }

    extend type WbMutation {
        "savedOn: the value the editor loaded; omit when creating (D131, R104)."
        storeWebsiteBuilderPageWorkflow(
            data: WorkflowsWorkflowInput!
            savedOn: String
        ): WbPageWorkflowResponse!
        deleteWebsiteBuilderPageWorkflow(id: ID!): WbPageWorkflowResponse!
        requestWebsiteBuilderPageReview(
            revisionId: ID!
            title: String
            picks: [WorkflowsReviewPickInput!]
        ): WbPageReviewResponse!
        startWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!): WbPageReviewResponse!
        takeOverWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            notifyPreviousOwner: Boolean = true
        ): WbPageReviewResponse!
        reassignWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            userId: ID!
        ): WbPageReviewResponse!
        restartWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!): WbPageReviewResponse!
        approveWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): WbPageReviewResponse!
        rejectWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            comment: String
        ): WbPageReviewResponse!
        cancelWebsiteBuilderPageReview(reviewId: ID!): WbPageReviewResponse!
        "Cancels every in-progress review of the page, or of one revision when \`revisionId\` is given, before a trash or delete (D134)."
        cancelWebsiteBuilderPageReviewsForDelete(
            pageId: ID!
            revisionId: ID
            action: WorkflowsReviewsForDeleteAction!
        ): WbPageReviewArrayResponse!
    }
`;

/**
 * Website Builder pages workflow and review operations on the `websiteBuilder` root of `/graphql`
 * (R88, D136). Each resolver calls its wrapper use case inline (D132); the wrappers check
 * identity, permissions and page access (D133). Registered only with the
 * `advancedPublishingWorkflow` license (R100).
 */
class WebsiteBuilderWorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(WB_WORKFLOWS_TYPE_DEFS);

        // Workflows
        builder.addResolver({
            path: "WbQuery.listWebsiteBuilderPageWorkflows",
            dependencies: [ListWebsiteBuilderPageWorkflowsUseCase],
            resolver: (listWorkflows: ListWebsiteBuilderPageWorkflowsUseCase.Interface) => {
                return async () => {
                    const result = await listWorkflows.execute();
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    // Unpaged (R59): one page with every pages workflow.
                    return new ListResponse(result.value, { cursor: null, hasMoreItems: false });
                };
            }
        });

        builder.addResolver<GetWebsiteBuilderPageWorkflowUseCase.Input>({
            path: "WbQuery.getWebsiteBuilderPageWorkflow",
            dependencies: [GetWebsiteBuilderPageWorkflowUseCase],
            resolver: (getWorkflow: GetWebsiteBuilderPageWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<StoreWebsiteBuilderPageWorkflowArgs>({
            path: "WbMutation.storeWebsiteBuilderPageWorkflow",
            dependencies: [StoreWebsiteBuilderPageWorkflowUseCase],
            resolver: (storeWorkflow: StoreWebsiteBuilderPageWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await storeWorkflow.execute({
                        workflow: args.data,
                        savedOn: args.savedOn
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<DeleteWebsiteBuilderPageWorkflowUseCase.Input>({
            path: "WbMutation.deleteWebsiteBuilderPageWorkflow",
            dependencies: [DeleteWebsiteBuilderPageWorkflowUseCase],
            resolver: (deleteWorkflow: DeleteWebsiteBuilderPageWorkflowUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteWorkflow.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        // Review reads
        builder.addResolver<GetWebsiteBuilderPageReviewUseCase.Input>({
            path: "WbQuery.getWebsiteBuilderPageReview",
            dependencies: [GetWebsiteBuilderPageReviewUseCase],
            resolver: (getReview: GetWebsiteBuilderPageReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getReview.execute({ id: args.id });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<GetWebsiteBuilderPageReviewStepRunUseCase.Input>({
            path: "WbQuery.getWebsiteBuilderPageReviewStepRun",
            dependencies: [GetWebsiteBuilderPageReviewStepRunUseCase],
            resolver: (getStepRun: GetWebsiteBuilderPageReviewStepRunUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getStepRun.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        taskId: args.taskId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<GetWebsiteBuilderPageTargetReviewArgs>({
            path: "WbQuery.getWebsiteBuilderPageTargetReview",
            dependencies: [GetWebsiteBuilderPageTargetReviewUseCase],
            resolver: (getTargetReview: GetWebsiteBuilderPageTargetReviewUseCase.Interface) => {
                return async ({ args }) => {
                    // A malformed revision id is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await getTargetReview.execute({
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListWebsiteBuilderPageReviewsUseCase.Input>({
            path: "WbQuery.listWebsiteBuilderPageReviews",
            dependencies: [ListWebsiteBuilderPageReviewsUseCase],
            resolver: (listReviews: ListWebsiteBuilderPageReviewsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listReviews.execute({
                        list: args.list,
                        where: args.where,
                        sort: args.sort,
                        limit: args.limit,
                        after: args.after
                    });
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        // Review actions
        builder.addResolver<RequestWebsiteBuilderPageReviewArgs>({
            path: "WbMutation.requestWebsiteBuilderPageReview",
            dependencies: [RequestWebsiteBuilderPageReviewUseCase],
            resolver: (requestReview: RequestWebsiteBuilderPageReviewUseCase.Interface) => {
                return async ({ args }) => {
                    // The page id comes from the revision id, `<pageId>#<version>` (R88); a
                    // malformed one is a validation error, never a throw (R107).
                    if (!isValidRevisionId(args.revisionId)) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await requestReview.execute({
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId,
                        title: args.title,
                        picks: args.picks ?? undefined
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<StartWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.startWebsiteBuilderPageReviewStep",
            dependencies: [StartWebsiteBuilderPageReviewStepUseCase],
            resolver: (startStep: StartWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await startStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<TakeOverWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.takeOverWebsiteBuilderPageReviewStep",
            dependencies: [TakeOverWebsiteBuilderPageReviewStepUseCase],
            resolver: (takeOverStep: TakeOverWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await takeOverStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        notifyPreviousOwner: args.notifyPreviousOwner
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ReassignWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.reassignWebsiteBuilderPageReviewStep",
            dependencies: [ReassignWebsiteBuilderPageReviewStepUseCase],
            resolver: (reassignStep: ReassignWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await reassignStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        userId: args.userId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<RestartWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.restartWebsiteBuilderPageReviewStep",
            dependencies: [RestartWebsiteBuilderPageReviewStepUseCase],
            resolver: (restartStep: RestartWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await restartStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ApproveWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.approveWebsiteBuilderPageReviewStep",
            dependencies: [ApproveWebsiteBuilderPageReviewStepUseCase],
            resolver: (approveStep: ApproveWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await approveStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<RejectWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.rejectWebsiteBuilderPageReviewStep",
            dependencies: [RejectWebsiteBuilderPageReviewStepUseCase],
            resolver: (rejectStep: RejectWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await rejectStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        comment: args.comment
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelWebsiteBuilderPageReviewUseCase.Input>({
            path: "WbMutation.cancelWebsiteBuilderPageReview",
            dependencies: [CancelWebsiteBuilderPageReviewUseCase],
            resolver: (cancelReview: CancelWebsiteBuilderPageReviewUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await cancelReview.execute({ reviewId: args.reviewId });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<CancelWebsiteBuilderPageReviewsForDeleteArgs>({
            path: "WbMutation.cancelWebsiteBuilderPageReviewsForDelete",
            dependencies: [CancelWebsiteBuilderPageReviewsForDeleteUseCase],
            resolver: (
                cancelForDelete: CancelWebsiteBuilderPageReviewsForDeleteUseCase.Interface
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
                        targetId: args.pageId,
                        targetRevisionId: args.revisionId,
                        action: args.action
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        // Routing (R120, R121, R124, R125)
        builder.addResolver<ListWebsiteBuilderPageStepCandidatesArgs>({
            path: "WbQuery.listWebsiteBuilderPageStepCandidates",
            dependencies: [ListWebsiteBuilderPageStepCandidatesUseCase],
            resolver: (listCandidates: ListWebsiteBuilderPageStepCandidatesUseCase.Interface) => {
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
                        targetId: parseIdentifier(args.revisionId).id,
                        targetRevisionId: args.revisionId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListWebsiteBuilderPageReviewStepCandidatesUseCase.Input>({
            path: "WbQuery.listWebsiteBuilderPageReviewStepCandidates",
            dependencies: [ListWebsiteBuilderPageReviewStepCandidatesUseCase],
            resolver: (
                listCandidates: ListWebsiteBuilderPageReviewStepCandidatesUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const result = await listCandidates.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<InspectWebsiteBuilderPageRoutingUseCase.Input>({
            path: "WbQuery.inspectWebsiteBuilderPageRouting",
            dependencies: [InspectWebsiteBuilderPageRoutingUseCase],
            resolver: (inspectRouting: InspectWebsiteBuilderPageRoutingUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await inspectRouting.execute({
                        stepConfig: args.stepConfig,
                        requesterId: args.requesterId,
                        folderId: args.folderId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<WebsiteBuilderPageFolderExistsUseCase.Input>({
            path: "WbQuery.websiteBuilderPageFolderExists",
            dependencies: [WebsiteBuilderPageFolderExistsUseCase],
            resolver: (folderExists: WebsiteBuilderPageFolderExistsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await folderExists.execute({ id: args.id });
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

export const WebsiteBuilderWorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WebsiteBuilderWorkflowsSchemaFactoryImpl,
    dependencies: []
});
