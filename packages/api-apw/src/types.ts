import { Page, OnBeforePageCreateFromTopicParams } from "@webiny/api-page-builder/types";
import { CmsContext, CmsModel } from "@webiny/api-headless-cms/types";
import { Context } from "@webiny/handler/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { Topic } from "@webiny/pubsub/types";

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
    where: ListWhere;
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
        };
    };
}

export interface CustomEventParams extends OnBeforePageCreateFromTopicParams {
    page: PageWithWorkflow;
}

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

interface BaseFields {
    id: string;
    createdOn: string;
    savedOn: string;
    createdBy: CreatedBy;
}

export interface ApwReviewer extends BaseFields {
    identityId: string;
    displayName: string | null;
    type: string;
}

export interface ApwComment extends BaseFields {
    body: JSON;
    changeRequest: {
        id: string;
        entryId: string;
        modelId: string;
    };
}

export interface ApwChangeRequest extends BaseFields {
    body: JSON;
    title: string;
    resolved: boolean;
    step: string;
    media: File;
}

export interface ApwContentReviewStep {
    type: ApwWorkflowStepTypes;
    title: string;
    slug: string;
    reviewers: ApwReviewer[];
    status: ApwContentReviewStepStatus;
    pendingChangeRequests: number;
    signOffProvidedOn: string | null;
    signOffProvidedBy: CreatedBy | null;
}

export interface ApwContentReview extends BaseFields {
    status: ApwContentReviewStatus;
    content: {
        id: string;
        type: string;
        settings: JSON;
    };
    steps: Array<ApwContentReviewStep>;
}

export interface ApwWorkflow extends BaseFields {
    title: string;
    steps: ApwWorkflowStep[];
    scope: ApwWorkflowScope;
    app: string;
}

interface ApwWorkflowScope {
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

export interface ApwWorkflowStep {
    title: string;
    type: ApwWorkflowStepTypes;
    reviewers: ApwReviewer[];
    slug: string;
}

export interface ApwContentReviewStep extends ApwWorkflowStep {
    status: ApwContentReviewStepStatus;
    pendingChangeRequests: number;
}

interface CreateApwWorkflowParams {
    app: ApwWorkflowApplications;
    title: string;
    scope: ApwWorkflowScope;
    steps: ApwWorkflowStep[];
}

interface UpdateApwWorkflowParams {
    title?: string;
    scope?: ApwWorkflowScope;
    steps?: ApwWorkflowStep[];
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
    changeRequest: {
        id: string;
    };
}

interface UpdateApwCommentParams {
    body: Record<string, any>;
}

interface CreateApwChangeRequestParams {
    title: string;
    body: JSON;
    resolved: boolean;
    media: JSON;
}

interface UpdateApwChangeRequestParams {
    title: string;
    body: JSON;
    resolved: boolean;
    media: JSON;
}

export interface ApwContentReviewContent {
    id: string;
    type: ApwContentTypes;
    settings: Record<string, any>;
}

export interface CreateApwContentReviewParams {
    content: ApwContentReviewContent;
    workflow: string;
    steps: ApwContentReviewStep[];
    status: ApwContentReviewStatus;
}

interface UpdateApwContentReviewParams {
    steps: ApwContentReviewStep[];
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
    list(params: ListParams): Promise<[ApwContentReview[], ListMeta]>;

    provideSignOff(id: string, step: string): Promise<Boolean>;

    retractSignOff(id: string, step: string): Promise<Boolean>;

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

export type WorkflowGetter = (id: string, settings: { modelId?: string }) => Promise<string | null>;

export interface AdvancedPublishingWorkflow {
    addWorkflowGetter: (type: ApwContentTypes, func: WorkflowGetter) => void;
    getWorkflowGetter: (type: ApwContentTypes) => WorkflowGetter;
    workflow: ApwWorkflowCrud;
    reviewer: ApwReviewerCrud;
    comment: ApwCommentCrud;
    changeRequest: ApwChangeRequestCrud;
    contentReview: ApwContentReviewCrud;
}

export interface ApwContext extends Context, CmsContext {
    apw: AdvancedPublishingWorkflow;
    pageBuilder: PageBuilderContextObject;
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
type StorageOperationsListContentReviewsParams = ListParams;

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
