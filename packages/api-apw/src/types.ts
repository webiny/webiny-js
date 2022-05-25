import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import {
    Page,
    OnBeforePageCreateTopicParams,
    OnBeforePageCreateFromTopicParams,
    OnBeforePageUpdateTopicParams,
    OnBeforePagePublishTopicParams,
    OnBeforePageRequestReviewTopicParams
} from "@webiny/api-page-builder/types";
import { Context } from "@webiny/handler/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { Topic } from "@webiny/pubsub/types";
import { ApwScheduleActionCrud, ScheduleActionContext } from "~/scheduler/types";
import HandlerClient from "@webiny/handler-client/HandlerClient";
import { WcpContextObject } from "@webiny/api-wcp/types";

export interface ApwFile {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
}

export interface ListWhere {
    /**
     * Fields.
     */
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    /**
     * Who created the entry?
     */
    createdBy?: string;
    createdBy_not?: string;
    createdBy_in?: string[];
    createdBy_not_in?: string[];
}

export interface ListParams {
    where?: ListWhere;
    sort?: string[];
    limit?: number;
    after?: string | null;
}

export interface ListMeta {
    /**
     * A cursor for pagination.
     */
    cursor: string | null;
    /**
     * Is there more items to load?
     */
    hasMoreItems: boolean;
    /**
     * Total count of the items in the storage.
     */
    totalCount: number;
}

export enum ApwContentTypes {
    PAGE = "page",
    CMS_ENTRY = "cms_entry"
}

export interface PageWithWorkflow extends Page {
    settings: Page["settings"] & {
        apw: {
            workflowId: string;
            contentReviewId: string | null;
        };
    };
}

export type ApwOnBeforePageCreateTopicParams = OnBeforePageCreateTopicParams<PageWithWorkflow>;

export type ApwOnBeforePageCreateFromTopicParams =
    OnBeforePageCreateFromTopicParams<PageWithWorkflow>;

export type ApwOnBeforePageUpdateTopicParams = OnBeforePageUpdateTopicParams<PageWithWorkflow>;

export type ApwOnBeforePagePublishTopicParams = OnBeforePagePublishTopicParams<PageWithWorkflow>;

export type ApwOnBeforePageRequestReviewTopicParams =
    OnBeforePageRequestReviewTopicParams<PageWithWorkflow>;

export enum WorkflowScopeTypes {
    DEFAULT = "default",
    PB = "pb",
    CMS = "cms"
}

export enum ApwContentReviewStepStatus {
    DONE = "done",
    ACTIVE = "active",
    INACTIVE = "inactive"
}

export enum ApwWorkflowApplications {
    PB = "pageBuilder",
    CMS = "cms"
}

/**
 * A interface describing the reference to a user that created some data in the database.
 *
 * @category General
 */
export interface CreatedBy {
    /**
     * ID if the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string | null;
    /**
     * Type of the user (admin, user)
     */
    type: string;
}

export interface ApwBaseFields {
    id: string;
    createdOn: string;
    savedOn: string;
    createdBy: CreatedBy;
}

export interface ApwReviewer extends ApwBaseFields {
    identityId: string;
    displayName: string | null;
    type: string;
}

export interface ApwComment extends ApwBaseFields {
    body: Record<string, any>;
    changeRequest: string;
    step: string;
    media: ApwFile;
}

export interface ApwChangeRequest extends ApwBaseFields {
    body: Record<string, any>;
    title: string;
    resolved: boolean;
    step: string;
    media: ApwFile;
}

export interface ApwContentReviewStep {
    type: ApwWorkflowStepTypes;
    title: string;
    slug: string;
    reviewers: ApwReviewer[];
    status: ApwContentReviewStepStatus;
    pendingChangeRequests: number;
    totalComments: number;
    signOffProvidedOn: string | null;
    signOffProvidedBy: CreatedBy | null;
}

export interface ApwContentReview extends ApwBaseFields {
    title: string;
    status: ApwContentReviewStatus;
    content: ApwContentReviewContent;
    steps: Array<ApwContentReviewStep>;
    latestCommentId: string | null;
}

export interface ApwWorkflow extends ApwBaseFields {
    title: string;
    steps: ApwWorkflowStep[];
    scope: ApwWorkflowScope;
    app: ApwWorkflowApplications;
}

export interface ApwWorkflowScope {
    type: WorkflowScopeTypes;
    data: {
        categories?: string[];
        pages?: string[];
        models?: string[];
        entries?: string[];
    };
}

export enum ApwWorkflowStepTypes {
    MANDATORY_BLOCKING = "mandatoryBlocking",
    MANDATORY_NON_BLOCKING = "mandatoryNonBlocking",
    NON_MANDATORY = "notMandatory"
}

export enum ApwContentReviewStatus {
    UNDER_REVIEW = "underReview",
    READY_TO_BE_PUBLISHED = "readyToBePublished",
    PUBLISHED = "published"
}

export type ApwContentReviewListFilter = ApwContentReviewStatus | "requiresMyAttention";

export interface ApwWorkflowStep<TReviewer = ApwReviewer> {
    title: string;
    type: ApwWorkflowStepTypes;
    reviewers: TReviewer[];
    id: string;
}

export interface ApwContentReviewStep extends ApwWorkflowStep {
    status: ApwContentReviewStepStatus;
    pendingChangeRequests: number;
}

export interface CreateApwWorkflowParams<TReviewer = string> {
    app: ApwWorkflowApplications;
    title: string;
    scope: ApwWorkflowScope;
    steps: ApwWorkflowStep<TReviewer>[];
}

export interface UpdateApwWorkflowParams<TReviewer = string> {
    title?: string;
    scope?: ApwWorkflowScope;
    steps?: ApwWorkflowStep<TReviewer>[];
}

export interface ListWorkflowsParams extends ListParams {
    where: ListWhere & {
        app?: ApwWorkflowApplications;
    };
}

interface CreateReviewerParams {
    identityId: string;
    displayName: string | null;
    type: string;
}

interface CreateApwCommentParams {
    body: Record<string, any>;
    changeRequest: string;
    step: string;
    media: ApwFile;
}

interface UpdateApwCommentParams {
    body: Record<string, any>;
}

interface CreateApwChangeRequestParams {
    title: string;
    step: string;
    body: Record<string, any>;
    resolved: boolean;
    media: Record<string, any>;
}

interface UpdateApwChangeRequestParams {
    title: string;
    body: Record<string, any>;
    resolved: boolean;
    media: Record<string, any>;
}

enum ApwScheduleActionTypes {
    PUBLISH = "publish",
    UNPUBLISH = "unpublish"
}

export interface ApwScheduleActionData {
    action: ApwScheduleActionTypes;
    type: ApwContentTypes;
    datetime: string;
    entryId: string;
}

export interface ApwContentReviewContent {
    id: string;
    type: ApwContentTypes;
    settings: {
        modelId?: string;
    };
    scheduledOn?: string | null;
    scheduledBy?: string | null;
    scheduledActionId?: string | null;
    publishedBy?: string | null;
}

export interface CreateApwContentReviewParams {
    content: ApwContentReviewContent;
}

interface UpdateApwContentReviewParams {
    title?: string;
    steps?: ApwContentReviewStep[];
    status?: ApwContentReviewStatus;
    content?: ApwContentReviewContent;
}

interface BaseApwCrud<TEntry, TCreateEntryParams, TUpdateEntryParams> {
    get(id: string): Promise<TEntry>;

    create(data: TCreateEntryParams): Promise<TEntry>;

    update(id: string, data: TUpdateEntryParams): Promise<TEntry>;

    delete(id: string): Promise<Boolean>;
}

export interface ApwWorkflowCrud
    extends BaseApwCrud<ApwWorkflow, CreateApwWorkflowParams, UpdateApwWorkflowParams> {
    list(params: ListWorkflowsParams): Promise<[ApwWorkflow[], ListMeta]>;

    /**
     * Lifecycle events
     */
    onBeforeWorkflowCreate: Topic<OnBeforeWorkflowCreateTopicParams>;
    onAfterWorkflowCreate: Topic<OnAfterWorkflowCreateTopicParams>;
    onBeforeWorkflowUpdate: Topic<OnBeforeWorkflowUpdateTopicParams>;
    onAfterWorkflowUpdate: Topic<OnAfterWorkflowUpdateTopicParams>;
    onBeforeWorkflowDelete: Topic<OnBeforeWorkflowDeleteTopicParams>;
    onAfterWorkflowDelete: Topic<OnAfterWorkflowDeleteTopicParams>;
}

export interface ApwReviewerListParams extends ListParams {
    where: ListParams["where"] & {
        identityId?: string;
    };
}

export interface ApwReviewerCrud
    extends BaseApwCrud<ApwReviewer, CreateReviewerParams, UpdateApwReviewerData> {
    list(params: ApwReviewerListParams): Promise<[ApwReviewer[], ListMeta]>;

    /**
     * Lifecycle events
     */
    onBeforeReviewerCreate: Topic<OnBeforeReviewerCreateTopicParams>;
    onAfterReviewerCreate: Topic<OnAfterReviewerCreateTopicParams>;
    onBeforeReviewerUpdate: Topic<OnBeforeReviewerUpdateTopicParams>;
    onAfterReviewerUpdate: Topic<OnAfterReviewerUpdateTopicParams>;
    onBeforeReviewerDelete: Topic<OnBeforeReviewerDeleteTopicParams>;
    onAfterReviewerDelete: Topic<OnAfterReviewerDeleteTopicParams>;
}

export interface ApwCommentListParams extends ListParams {
    where: ListParams["where"] & {
        changeRequest?: {
            id?: string;
        };
    };
}

export interface ApwCommentCrud
    extends BaseApwCrud<ApwComment, CreateApwCommentParams, UpdateApwCommentParams> {
    list(params: ApwCommentListParams): Promise<[ApwComment[], ListMeta]>;

    /**
     * Lifecycle events
     */
    onBeforeCommentCreate: Topic<OnBeforeCommentCreateTopicParams>;
    onAfterCommentCreate: Topic<OnAfterCommentCreateTopicParams>;
    onBeforeCommentUpdate: Topic<OnBeforeCommentUpdateTopicParams>;
    onAfterCommentUpdate: Topic<OnAfterCommentUpdateTopicParams>;
    onBeforeCommentDelete: Topic<OnBeforeCommentDeleteTopicParams>;
    onAfterCommentDelete: Topic<OnAfterCommentDeleteTopicParams>;
}

export interface ApwChangeRequestListParams extends ListParams {
    where: ListParams["where"] & {
        step?: string;
    };
}

export interface ApwChangeRequestCrud
    extends BaseApwCrud<
        ApwChangeRequest,
        CreateApwChangeRequestParams,
        UpdateApwChangeRequestParams
    > {
    list(params: ApwChangeRequestListParams): Promise<[ApwChangeRequest[], ListMeta]>;

    /**
     * Lifecycle events
     */
    onBeforeChangeRequestCreate: Topic<OnBeforeChangeRequestCreateTopicParams>;
    onAfterChangeRequestCreate: Topic<OnAfterChangeRequestCreateTopicParams>;
    onBeforeChangeRequestUpdate: Topic<OnBeforeChangeRequestUpdateTopicParams>;
    onAfterChangeRequestUpdate: Topic<OnAfterChangeRequestUpdateTopicParams>;
    onBeforeChangeRequestDelete: Topic<OnBeforeChangeRequestDeleteTopicParams>;
    onAfterChangeRequestDelete: Topic<OnAfterChangeRequestDeleteTopicParams>;
}

export interface ApwContentReviewCrud
    extends BaseApwCrud<
        ApwContentReview,
        CreateApwContentReviewParams,
        UpdateApwContentReviewParams
    > {
    list(params: ApwContentReviewListParams): Promise<[ApwContentReview[], ListMeta]>;

    provideSignOff(id: string, step: string): Promise<Boolean>;

    retractSignOff(id: string, step: string): Promise<Boolean>;

    isReviewRequired(data: ApwContentReviewContent): Promise<{
        isReviewRequired: boolean;
        contentReviewId?: string;
    }>;

    publishContent(id: string, datetime?: string): Promise<Boolean>;

    unpublishContent(id: string, datetime?: string): Promise<Boolean>;

    scheduleAction(data: ApwScheduleActionData): Promise<string>;

    deleteScheduledAction(id: string): Promise<boolean>;

    /**
     * Lifecycle events
     */
    onBeforeContentReviewCreate: Topic<OnBeforeContentReviewCreateTopicParams>;
    onAfterContentReviewCreate: Topic<OnAfterContentReviewCreateTopicParams>;
    onBeforeContentReviewUpdate: Topic<OnBeforeContentReviewUpdateTopicParams>;
    onAfterContentReviewUpdate: Topic<OnAfterContentReviewUpdateTopicParams>;
    onBeforeContentReviewDelete: Topic<OnBeforeContentReviewDeleteTopicParams>;
    onAfterContentReviewDelete: Topic<OnAfterContentReviewDeleteTopicParams>;
}

export type ContentGetter = (
    id: string,
    settings: { modelId?: string }
) => Promise<PageWithWorkflow | (CmsEntry & { title: string }) | null>;

export type ContentPublisher = (
    id: string,
    settings: { modelId?: string }
) => Promise<Boolean | null>;

export type ContentUnPublisher = (
    id: string,
    settings: { modelId?: string }
) => Promise<Boolean | null>;

export interface AdvancedPublishingWorkflow {
    addContentGetter: (type: ApwContentTypes, func: ContentGetter) => void;
    getContentGetter: (type: ApwContentTypes) => ContentGetter;
    addContentPublisher: (type: ApwContentTypes, func: ContentPublisher) => void;
    getContentPublisher: (type: ApwContentTypes) => ContentPublisher;
    addContentUnPublisher: (type: ApwContentTypes, func: ContentUnPublisher) => void;
    getContentUnPublisher: (type: ApwContentTypes) => ContentUnPublisher;
    workflow: ApwWorkflowCrud;
    reviewer: ApwReviewerCrud;
    comment: ApwCommentCrud;
    changeRequest: ApwChangeRequestCrud;
    contentReview: ApwContentReviewCrud;
    scheduleAction: ApwScheduleActionCrud;
}

export interface ApwContext extends Context, CmsContext {
    apw: AdvancedPublishingWorkflow;
    pageBuilder: PageBuilderContextObject;
    wcp: WcpContextObject;
    scheduleAction: ScheduleActionContext["scheduleAction"];
}

export interface LifeCycleHookCallbackParams {
    apw: ApwContext["apw"];
    security: ApwContext["security"];
    cms?: ApwContext["cms"];
}

export interface CreateApwParams {
    getLocale: () => I18NLocale;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getPermission: (name: string) => Promise<SecurityPermission | null>;
    storageOperations: ApwStorageOperations;
    scheduler: ApwScheduleActionCrud;
    handlerClient: HandlerClient;
}

interface StorageOperationsGetReviewerParams {
    id: string;
}

type StorageOperationsListReviewersParams = ApwReviewerListParams;

interface CreateApwReviewerData {
    identityId: string;
    displayName: string | null;
    type: string;
}

interface UpdateApwReviewerData {
    identityId: string;
    displayName: string | null;
    type: string;
}

interface StorageOperationsCreateReviewerParams {
    data: CreateApwReviewerData;
}

interface StorageOperationsUpdateReviewerParams {
    id: string;
    data: UpdateApwReviewerData;
}

interface StorageOperationsDeleteReviewerParams {
    id: string;
}

interface StorageOperationsGetParams {
    id: string;
}

interface StorageOperationsDeleteParams {
    id: string;
}

type StorageOperationsGetWorkflowParams = StorageOperationsGetParams;

type StorageOperationsListWorkflowsParams = ListParams;

interface StorageOperationsCreateWorkflowParams {
    data: CreateApwWorkflowParams;
}

interface StorageOperationsUpdateWorkflowParams {
    id: string;
    data: UpdateApwWorkflowParams;
}

type StorageOperationsDeleteWorkflowParams = StorageOperationsDeleteParams;
type StorageOperationsGetContentReviewParams = StorageOperationsGetParams;

export interface ApwContentReviewListParams extends ListParams {
    where?: ListWhere & {
        status?: ApwContentReviewListFilter;
        title?: string;
        title_contains?: string;
    };
}

type StorageOperationsListContentReviewsParams = ApwContentReviewListParams;

interface StorageOperationsCreateContentReviewParams {
    data: CreateApwContentReviewParams;
}

interface StorageOperationsUpdateContentReviewParams {
    id: string;
    data: UpdateApwContentReviewParams;
}

type StorageOperationsDeleteContentReviewParams = StorageOperationsDeleteParams;

type StorageOperationsGetChangeRequestParams = StorageOperationsGetParams;
type StorageOperationsListChangeRequestsParams = ApwChangeRequestListParams;

interface StorageOperationsCreateChangeRequestParams {
    data: CreateApwChangeRequestParams;
}

interface StorageOperationsUpdateChangeRequestParams {
    id: string;
    data: UpdateApwChangeRequestParams;
}

type StorageOperationsDeleteChangeRequestParams = StorageOperationsDeleteParams;

type StorageOperationsGetCommentParams = StorageOperationsGetParams;

type StorageOperationsDeleteCommentParams = StorageOperationsDeleteParams;
type StorageOperationsListCommentsParams = ApwCommentListParams;

interface StorageOperationsCreateCommentParams {
    data: CreateApwCommentParams;
}

interface StorageOperationsUpdateCommentParams {
    id: string;
    data: UpdateApwCommentParams;
}

export interface ApwReviewerStorageOperations {
    /*
     * Reviewer methods
     */
    getReviewer(params: StorageOperationsGetReviewerParams): Promise<ApwReviewer>;

    listReviewers(params: StorageOperationsListReviewersParams): Promise<[ApwReviewer[], ListMeta]>;

    createReviewer(params: StorageOperationsCreateReviewerParams): Promise<ApwReviewer>;

    updateReviewer(params: StorageOperationsUpdateReviewerParams): Promise<ApwReviewer>;

    deleteReviewer(params: StorageOperationsDeleteReviewerParams): Promise<Boolean>;
}

export interface ApwWorkflowStorageOperations {
    /*
     * Workflow methods
     */
    getWorkflow(params: StorageOperationsGetWorkflowParams): Promise<ApwWorkflow>;

    listWorkflows(params: StorageOperationsListWorkflowsParams): Promise<[ApwWorkflow[], ListMeta]>;

    createWorkflow(params: StorageOperationsCreateWorkflowParams): Promise<ApwWorkflow>;

    updateWorkflow(params: StorageOperationsUpdateWorkflowParams): Promise<ApwWorkflow>;

    deleteWorkflow(params: StorageOperationsDeleteWorkflowParams): Promise<Boolean>;
}

export interface ApwContentReviewStorageOperations {
    /*
     * ContentReview methods
     */
    getContentReview(params: StorageOperationsGetContentReviewParams): Promise<ApwContentReview>;

    listContentReviews(
        params: StorageOperationsListContentReviewsParams
    ): Promise<[ApwContentReview[], ListMeta]>;

    createContentReview(
        params: StorageOperationsCreateContentReviewParams
    ): Promise<ApwContentReview>;

    updateContentReview(
        params: StorageOperationsUpdateContentReviewParams
    ): Promise<ApwContentReview>;

    deleteContentReview(params: StorageOperationsDeleteContentReviewParams): Promise<Boolean>;
}

export interface ApwChangeRequestStorageOperations {
    /*
     * ChangeRequest methods
     */
    getChangeRequest(params: StorageOperationsGetChangeRequestParams): Promise<ApwChangeRequest>;

    listChangeRequests(
        params: StorageOperationsListChangeRequestsParams
    ): Promise<[ApwChangeRequest[], ListMeta]>;

    createChangeRequest(
        params: StorageOperationsCreateChangeRequestParams
    ): Promise<ApwChangeRequest>;

    updateChangeRequest(
        params: StorageOperationsUpdateChangeRequestParams
    ): Promise<ApwChangeRequest>;

    deleteChangeRequest(params: StorageOperationsDeleteChangeRequestParams): Promise<Boolean>;
}

export interface ApwCommentStorageOperations {
    /*
     * Comment methods
     */
    getComment(params: StorageOperationsGetCommentParams): Promise<ApwComment>;

    listComments(params: StorageOperationsListCommentsParams): Promise<[ApwComment[], ListMeta]>;

    createComment(params: StorageOperationsCreateCommentParams): Promise<ApwComment>;

    updateComment(params: StorageOperationsUpdateCommentParams): Promise<ApwComment>;

    deleteComment(params: StorageOperationsDeleteCommentParams): Promise<Boolean>;
}

export interface ApwStorageOperations
    extends ApwReviewerStorageOperations,
        ApwWorkflowStorageOperations,
        ApwContentReviewStorageOperations,
        ApwChangeRequestStorageOperations,
        ApwCommentStorageOperations {}

/**
 * @category Lifecycle events
 */
export interface OnBeforeCommentCreateTopicParams {
    input: CreateApwCommentParams;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterCommentCreateTopicParams {
    comment: ApwComment;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeCommentUpdateTopicParams {
    original: ApwComment;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterCommentUpdateTopicParams {
    original: ApwComment;
    comment: ApwComment;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeCommentDeleteTopicParams {
    comment: ApwComment;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterCommentDeleteTopicParams {
    comment: ApwComment;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeChangeRequestCreateTopicParams {
    input: CreateApwChangeRequestParams;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterChangeRequestCreateTopicParams {
    changeRequest: ApwChangeRequest;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeChangeRequestUpdateTopicParams {
    original: ApwChangeRequest;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterChangeRequestUpdateTopicParams {
    original: ApwChangeRequest;
    changeRequest: ApwChangeRequest;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeChangeRequestDeleteTopicParams {
    changeRequest: ApwChangeRequest;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterChangeRequestDeleteTopicParams {
    changeRequest: ApwChangeRequest;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeContentReviewCreateTopicParams {
    input: CreateApwContentReviewParams;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterContentReviewCreateTopicParams {
    contentReview: ApwContentReview;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeContentReviewUpdateTopicParams {
    original: ApwContentReview;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterContentReviewUpdateTopicParams {
    original: ApwContentReview;
    contentReview: ApwContentReview;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeContentReviewDeleteTopicParams {
    contentReview: ApwContentReview;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterContentReviewDeleteTopicParams {
    contentReview: ApwContentReview;
}

export interface CreateApwReviewerParams {
    type: string;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeReviewerCreateTopicParams {
    input: CreateApwReviewerParams;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterReviewerCreateTopicParams {
    reviewer: ApwReviewer;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeReviewerUpdateTopicParams {
    original: ApwReviewer;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterReviewerUpdateTopicParams {
    original: ApwReviewer;
    reviewer: ApwReviewer;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeReviewerDeleteTopicParams {
    reviewer: ApwReviewer;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterReviewerDeleteTopicParams {
    reviewer: ApwReviewer;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeWorkflowCreateTopicParams {
    input: CreateApwWorkflowParams;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterWorkflowCreateTopicParams {
    workflow: ApwWorkflow;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeWorkflowUpdateTopicParams {
    original: ApwWorkflow;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterWorkflowUpdateTopicParams {
    original: ApwWorkflow;
    workflow: ApwWorkflow;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeWorkflowDeleteTopicParams {
    workflow: ApwWorkflow;
}

/**
 * @category Lifecycle events
 */
export interface OnAfterWorkflowDeleteTopicParams {
    workflow: ApwWorkflow;
}

export type WorkflowModelDefinition = Pick<
    CmsModel,
    "name" | "modelId" | "layout" | "titleFieldId" | "description" | "fields"
>;
