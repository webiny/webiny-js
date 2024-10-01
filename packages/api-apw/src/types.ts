import {
    CmsEntry as BaseCmsEntry,
    OnEntryBeforePublishTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryAfterUnpublishTopicParams,
    CmsEntryListSort
} from "@webiny/api-headless-cms/types";
import {
    Page,
    OnPageBeforeCreateTopicParams,
    OnPageBeforeCreateFromTopicParams,
    OnPageBeforeUpdateTopicParams,
    OnPageBeforePublishTopicParams,
    PageSettings
} from "@webiny/api-page-builder/types";
import { Context } from "@webiny/api/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { Topic } from "@webiny/pubsub/types";
import { ApwScheduleActionCrud, ScheduleActionContext } from "~/scheduler/types";
import HandlerClient from "@webiny/handler-client/HandlerClient";
import { PluginsContainer } from "@webiny/plugins";
import { WcpContextObject } from "@webiny/api-wcp/types";
import { MailerContext } from "@webiny/api-mailer/types";
import { AdminSettingsContext } from "@webiny/api-admin-settings/types";

export interface ApwCmsEntry extends BaseCmsEntry {
    title: string;
    meta: {
        apw?: {
            contentReviewId?: string | null;
            workflowId?: string | null;
        };
    };
}

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
    sort?: CmsEntryListSort;
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

export interface PageSettingsWithWorkflow extends PageSettings {
    apw: {
        workflowId: string;
        contentReviewId: string | null;
    };
}

export interface PageWithWorkflow extends Page {
    settings: PageSettingsWithWorkflow;
}

export type ApwOnPageBeforeCreateTopicParams = OnPageBeforeCreateTopicParams<PageWithWorkflow>;

export type ApwOnPageBeforeCreateFromTopicParams =
    OnPageBeforeCreateFromTopicParams<PageWithWorkflow>;

export type ApwOnPageBeforeUpdateTopicParams = OnPageBeforeUpdateTopicParams<PageWithWorkflow>;

export type ApwOnPageBeforePublishTopicParams = OnPageBeforePublishTopicParams<PageWithWorkflow>;

export enum WorkflowScopeTypes {
    DEFAULT = "default",
    CUSTOM = "custom"
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
export interface ApwIdentity {
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
    entryId: string;

    createdOn: string;
    modifiedOn: string | null;
    savedOn: string;
    createdBy: ApwIdentity;
    modifiedBy: ApwIdentity;
    savedBy: ApwIdentity;
}

export interface ApwReviewer extends ApwBaseFields {
    identityId: string;
    displayName: string | null;
    type: string;
    email?: string;
}

export interface ApwReviewerWithEmail extends Omit<ApwReviewer, "email"> {
    email: string;
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
    signOffProvidedBy: ApwIdentity | null;
}

export interface ApwContentReview extends ApwBaseFields {
    title: string;
    reviewStatus: ApwContentReviewStatus;
    content: ApwContentReviewContent;
    steps: Array<ApwContentReviewStep>;
    latestCommentId: string | null;
    workflowId: string;
}

export interface ApwWorkflow extends ApwBaseFields {
    title: string;
    steps: ApwWorkflowStep[];
    scope: ApwWorkflowScope;
    app: ApwWorkflowApplications;
}

interface ApwWorkflowScopeCmsEntry {
    id: string;
    modelId: string;
}

export interface ApwWorkflowScope {
    type: WorkflowScopeTypes;
    data: {
        categories?: string[];
        pages?: string[];
        models?: string[];
        entries?: ApwWorkflowScopeCmsEntry[];
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
    where?: ListWhere & {
        app?: ApwWorkflowApplications;
    };
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
    /**
     * We will add modelId to the data for now.
     * TODO extract in separate package?
     */
    modelId?: string;
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
    reviewStatus: ApwContentReviewStatus;
    workflowId?: string;
}

export interface UpdateApwContentReviewParams {
    title?: string;
    steps?: ApwContentReviewStep[];
    reviewStatus?: ApwContentReviewStatus;
    content?: ApwContentReviewContent;
}

interface BaseApwCrud<TEntry, TCreateEntryParams, TUpdateEntryParams> {
    get(id: string): Promise<TEntry>;

    create(data: TCreateEntryParams): Promise<TEntry>;

    update(id: string, data: TUpdateEntryParams): Promise<TEntry>;

    delete(id: string): Promise<boolean>;
}

export interface ApwWorkflowCrud
    extends BaseApwCrud<ApwWorkflow, CreateApwWorkflowParams, UpdateApwWorkflowParams> {
    list(params?: ListWorkflowsParams): Promise<[ApwWorkflow[], ListMeta]>;

    /**
     * Lifecycle events
     */
    onWorkflowBeforeCreate: Topic<OnWorkflowBeforeCreateTopicParams>;
    onWorkflowAfterCreate: Topic<OnWorkflowAfterCreateTopicParams>;
    onWorkflowBeforeUpdate: Topic<OnWorkflowBeforeUpdateTopicParams>;
    onWorkflowAfterUpdate: Topic<OnWorkflowAfterUpdateTopicParams>;
    onWorkflowBeforeDelete: Topic<OnWorkflowBeforeDeleteTopicParams>;
    onWorkflowAfterDelete: Topic<OnWorkflowAfterDeleteTopicParams>;
}

export interface ApwReviewerListParams extends ListParams {
    where: ListParams["where"] & {
        identityId?: string;
    };
}

export interface ApwReviewerCrud
    extends BaseApwCrud<ApwReviewer, CreateApwReviewerData, UpdateApwReviewerData> {
    list(params: ApwReviewerListParams): Promise<[ApwReviewer[], ListMeta]>;

    /**
     * Lifecycle events
     */
    onReviewerBeforeCreate: Topic<OnReviewerBeforeCreateTopicParams>;
    onReviewerAfterCreate: Topic<OnReviewerAfterCreateTopicParams>;
    onReviewerBeforeUpdate: Topic<OnReviewerBeforeUpdateTopicParams>;
    onReviewerAfterUpdate: Topic<OnReviewerAfterUpdateTopicParams>;
    onReviewerBeforeDelete: Topic<OnReviewerBeforeDeleteTopicParams>;
    onReviewerAfterDelete: Topic<OnReviewerAfterDeleteTopicParams>;
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
    onCommentBeforeCreate: Topic<OnCommentBeforeCreateTopicParams>;
    onCommentAfterCreate: Topic<OnCommentAfterCreateTopicParams>;
    onCommentBeforeUpdate: Topic<OnCommentBeforeUpdateTopicParams>;
    onCommentAfterUpdate: Topic<OnCommentAfterUpdateTopicParams>;
    onCommentBeforeDelete: Topic<OnCommentBeforeDeleteTopicParams>;
    onCommentAfterDelete: Topic<OnCommentAfterDeleteTopicParams>;
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
    onChangeRequestBeforeCreate: Topic<OnChangeRequestBeforeCreateTopicParams>;
    onChangeRequestAfterCreate: Topic<OnChangeRequestAfterCreateTopicParams>;
    onChangeRequestBeforeUpdate: Topic<OnChangeRequestBeforeUpdateTopicParams>;
    onChangeRequestAfterUpdate: Topic<OnChangeRequestAfterUpdateTopicParams>;
    onChangeRequestBeforeDelete: Topic<OnChangeRequestBeforeDeleteTopicParams>;
    onChangeRequestAfterDelete: Topic<OnChangeRequestAfterDeleteTopicParams>;
}

export interface ApwContentReviewCrud
    extends BaseApwCrud<
        ApwContentReview,
        CreateApwContentReviewParams,
        UpdateApwContentReviewParams
    > {
    list(params: ApwContentReviewListParams): Promise<[ApwContentReview[], ListMeta]>;

    provideSignOff(id: string, step: string): Promise<boolean>;

    retractSignOff(id: string, step: string): Promise<boolean>;

    isReviewRequired(data: ApwContentReviewContent): Promise<{
        isReviewRequired: boolean;
        contentReviewId?: string | null;
    }>;

    publishContent(id: string, datetime?: string): Promise<boolean>;

    unpublishContent(id: string, datetime?: string): Promise<boolean>;

    scheduleAction(data: ApwScheduleActionData): Promise<string>;

    deleteScheduledAction(id: string): Promise<boolean>;

    /**
     * Lifecycle events
     */
    onContentReviewBeforeCreate: Topic<OnContentReviewBeforeCreateTopicParams>;
    onContentReviewAfterCreate: Topic<OnContentReviewAfterCreateTopicParams>;
    onContentReviewBeforeUpdate: Topic<OnContentReviewBeforeUpdateTopicParams>;
    onContentReviewAfterUpdate: Topic<OnContentReviewAfterUpdateTopicParams>;
    onContentReviewBeforeDelete: Topic<OnContentReviewBeforeDeleteTopicParams>;
    onContentReviewAfterDelete: Topic<OnContentReviewAfterDeleteTopicParams>;
    onContentReviewBeforeList: Topic<OnContentReviewBeforeListTopicParams>;
}

export type ContentGetter = (
    id: string,
    settings: { modelId?: string }
) => Promise<PageWithWorkflow | ApwCmsEntry | null>;

export type ContentPublisher = (
    id: string,
    settings: { modelId?: string }
) => Promise<boolean | null>;

export type ContentUnPublisher = (
    id: string,
    settings: { modelId?: string }
) => Promise<boolean | null>;

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

export interface ApwContext extends Context, MailerContext, AdminSettingsContext {
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
    plugins: PluginsContainer;
}

interface StorageOperationsGetReviewerParams {
    id: string;
}

type StorageOperationsListReviewersParams = ApwReviewerListParams;

interface CreateApwReviewerData {
    identityId: string;
    displayName: string | null;
    type: string;
    email?: string | null;
}

interface UpdateApwReviewerData {
    identityId: string;
    displayName: string | null;
    type: string;
    email?: string | null;
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
    where: ListWhere & {
        reviewStatus?: ApwContentReviewListFilter;
        title?: string;
        title_contains?: string;
        workflowId?: string;
        workflowId_in?: string[];
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

    deleteReviewer(params: StorageOperationsDeleteReviewerParams): Promise<boolean>;
}

export interface ApwWorkflowStorageOperations {
    /*
     * Workflow methods
     */
    getWorkflow(params: StorageOperationsGetWorkflowParams): Promise<ApwWorkflow>;

    listWorkflows(params: StorageOperationsListWorkflowsParams): Promise<[ApwWorkflow[], ListMeta]>;

    createWorkflow(params: StorageOperationsCreateWorkflowParams): Promise<ApwWorkflow>;

    updateWorkflow(params: StorageOperationsUpdateWorkflowParams): Promise<ApwWorkflow>;

    deleteWorkflow(params: StorageOperationsDeleteWorkflowParams): Promise<boolean>;
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

    deleteContentReview(params: StorageOperationsDeleteContentReviewParams): Promise<boolean>;
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

    deleteChangeRequest(params: StorageOperationsDeleteChangeRequestParams): Promise<boolean>;
}

export interface ApwCommentStorageOperations {
    /*
     * Comment methods
     */
    getComment(params: StorageOperationsGetCommentParams): Promise<ApwComment>;

    listComments(params: StorageOperationsListCommentsParams): Promise<[ApwComment[], ListMeta]>;

    createComment(params: StorageOperationsCreateCommentParams): Promise<ApwComment>;

    updateComment(params: StorageOperationsUpdateCommentParams): Promise<ApwComment>;

    deleteComment(params: StorageOperationsDeleteCommentParams): Promise<boolean>;
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
export interface OnCommentBeforeCreateTopicParams {
    input: CreateApwCommentParams;
}

/**
 * @category Lifecycle events
 */
export interface OnCommentAfterCreateTopicParams {
    comment: ApwComment;
}

/**
 * @category Lifecycle events
 */
export interface OnCommentBeforeUpdateTopicParams {
    original: ApwComment;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnCommentAfterUpdateTopicParams {
    original: ApwComment;
    comment: ApwComment;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnCommentBeforeDeleteTopicParams {
    comment: ApwComment;
}

/**
 * @category Lifecycle events
 */
export interface OnCommentAfterDeleteTopicParams {
    comment: ApwComment;
}

/**
 * @category Lifecycle events
 */
export interface OnChangeRequestBeforeCreateTopicParams {
    input: CreateApwChangeRequestParams;
}

/**
 * @category Lifecycle events
 */
export interface OnChangeRequestAfterCreateTopicParams {
    changeRequest: ApwChangeRequest;
}

/**
 * @category Lifecycle events
 */
export interface OnChangeRequestBeforeUpdateTopicParams {
    original: ApwChangeRequest;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnChangeRequestAfterUpdateTopicParams {
    original: ApwChangeRequest;
    changeRequest: ApwChangeRequest;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnChangeRequestBeforeDeleteTopicParams {
    changeRequest: ApwChangeRequest;
}

/**
 * @category Lifecycle events
 */
export interface OnChangeRequestAfterDeleteTopicParams {
    changeRequest: ApwChangeRequest;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewBeforeCreateTopicParams {
    input: CreateApwContentReviewParams;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewAfterCreateTopicParams {
    contentReview: ApwContentReview;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewBeforeUpdateTopicParams {
    original: ApwContentReview;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewAfterUpdateTopicParams {
    original: ApwContentReview;
    contentReview: ApwContentReview;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewBeforeDeleteTopicParams {
    contentReview: ApwContentReview;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewAfterDeleteTopicParams {
    contentReview: ApwContentReview;
}

/**
 * @category Lifecycle events
 */
export interface OnContentReviewBeforeListTopicParams {
    where: ApwContentReviewListParams["where"];
}

export interface CreateApwReviewerParams {
    type: string;
}

/**
 * @category Lifecycle events
 */
export interface OnReviewerBeforeCreateTopicParams {
    input: CreateApwReviewerParams;
}

/**
 * @category Lifecycle events
 */
export interface OnReviewerAfterCreateTopicParams {
    reviewer: ApwReviewer;
}

/**
 * @category Lifecycle events
 */
export interface OnReviewerBeforeUpdateTopicParams {
    original: ApwReviewer;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnReviewerAfterUpdateTopicParams {
    original: ApwReviewer;
    reviewer: ApwReviewer;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnReviewerBeforeDeleteTopicParams {
    reviewer: ApwReviewer;
}

/**
 * @category Lifecycle events
 */
export interface OnReviewerAfterDeleteTopicParams {
    reviewer: ApwReviewer;
}

/**
 * @category Lifecycle events
 */
export interface OnWorkflowBeforeCreateTopicParams {
    input: CreateApwWorkflowParams;
}

/**
 * @category Lifecycle events
 */
export interface OnWorkflowAfterCreateTopicParams {
    workflow: ApwWorkflow;
}

/**
 * @category Lifecycle events
 */
export interface OnWorkflowBeforeUpdateTopicParams {
    original: ApwWorkflow;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnWorkflowAfterUpdateTopicParams {
    original: ApwWorkflow;
    workflow: ApwWorkflow;
    input: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnWorkflowBeforeDeleteTopicParams {
    workflow: ApwWorkflow;
}

/**
 * @category Lifecycle events
 */
export interface OnWorkflowAfterDeleteTopicParams {
    workflow: ApwWorkflow;
}

/**
 * Headless CMS
 */
export interface OnCmsEntryBeforePublishTopicParams
    extends Omit<OnEntryBeforePublishTopicParams, "entry"> {
    entry: ApwCmsEntry;
}

export interface OnCmsEntryAfterPublishTopicParams
    extends Omit<OnEntryAfterPublishTopicParams, "entry"> {
    entry: ApwCmsEntry;
}

export interface OnCmsEntryAfterUnpublishTopicParams
    extends Omit<OnEntryAfterUnpublishTopicParams, "entry"> {
    entry: ApwCmsEntry;
}
