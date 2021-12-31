import { Page } from "@webiny/api-page-builder/types";
import {
    CmsContext,
    CmsEntryListParams,
    CmsEntryListWhere,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { Context } from "@webiny/handler/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";

export interface FieldResolverParams {
    fieldId: string;
    getModel: (context: ApwContext) => Promise<CmsModel>;
    getField: (model: CmsModel, fieldId: string) => CmsModelField;
    isRoot: Boolean;
}

export interface PageWithWorkflow extends Page {
    workflow?: string;
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
    displayName: string;
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
    displayName: string;
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
    signOffProvidedOn: string;
    signOffProvidedBy: CreatedBy;
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

interface CreateWorkflowParams {
    app: ApwWorkflowApplications;
    title: string;
    scope: ApwWorkflowScope;
    steps: ApwWorkflowStep[];
}

interface UpdateWorkflowParams {
    title?: string;
    scope?: ApwWorkflowScope;
    steps?: ApwWorkflowStep[];
}

export interface ListWorkflowsParams extends CmsEntryListParams {
    where: CmsEntryListWhere & {
        app?: ApwWorkflowApplications;
    };
}

interface CreateReviewerParams {
    identityId: string;
    displayName: string;
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

interface CreateApwContentReviewParams {
    content: string;
    workflow: string;
    steps: ApwContentReviewStep[];
    status: ApwContentReviewStatus;
}

interface UpdateApwContentReviewParams {
    steps: ApwContentReviewStep[];
}

interface BaseApwCrud<TEntry, TCreateEntryParams, TUpdateEntryParams> {
    getModel(): Promise<CmsModel>;

    get(id: string): Promise<TEntry>;

    create(data: TCreateEntryParams): Promise<TEntry>;

    update(id: string, data: TUpdateEntryParams): Promise<TEntry>;

    delete(id: string): Promise<Boolean>;
}

export interface ApwWorkflowCrud
    extends BaseApwCrud<ApwWorkflow, CreateWorkflowParams, UpdateWorkflowParams> {
    list(params: ListWorkflowsParams): Promise<[ApwWorkflow[], CmsEntryMeta]>;
}

export interface ApwReviewerCrud
    extends BaseApwCrud<ApwReviewer, CreateReviewerParams, UpdateApwReviewerData> {
    list(params: CmsEntryListParams): Promise<[ApwReviewer[], CmsEntryMeta]>;
}

export interface ApwCommentCrud
    extends BaseApwCrud<ApwComment, CreateApwCommentParams, UpdateApwCommentParams> {
    list(params: CmsEntryListParams): Promise<[ApwComment[], CmsEntryMeta]>;
}

export interface ApwChangeRequestCrud
    extends BaseApwCrud<
        ApwChangeRequest,
        CreateApwChangeRequestParams,
        UpdateApwChangeRequestParams
    > {
    list(params: CmsEntryListParams): Promise<[ApwChangeRequest[], CmsEntryMeta]>;
}

export interface ApwContentReviewCrud
    extends BaseApwCrud<
        ApwContentReview,
        CreateApwContentReviewParams,
        UpdateApwContentReviewParams
    > {
    list(params: CmsEntryListParams): Promise<[ApwContentReview[], CmsEntryMeta]>;

    provideSignOff(id: string, step: string): Promise<Boolean>;

    retractSignOff(id: string, step: string): Promise<Boolean>;
}

export interface AdvancedPublishingWorkflow {
    workflow: ApwWorkflowCrud;
    reviewer: ApwReviewerCrud;
    comment: ApwCommentCrud;
    changeRequest: ApwChangeRequestCrud;
    contentReview: ApwContentReviewCrud;
}

export interface ApwContext extends Context, CmsContext, PbContext {
    apw: AdvancedPublishingWorkflow;
}

export interface CreateApwParams {
    getLocale: () => I18NLocale;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getPermission: (name: string) => Promise<SecurityPermission>;
    storageOperations: ApwStorageOperations;
}

interface StorageOperationsGetReviewerParams {
    id: string;
}

type StorageOperationsListReviewersParams = CmsEntryListParams;

interface CreateApwReviewerData {
    identityId: string;
    displayName: string;
    type: string;
}

interface UpdateApwReviewerData {
    identityId: string;
    displayName: string;
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

type StorageOperationsListWorkflowsParams = CmsEntryListParams;

interface StorageOperationsCreateWorkflowParams {
    data: CreateWorkflowParams;
}

interface StorageOperationsUpdateWorkflowParams {
    id: string;
    data: UpdateWorkflowParams;
}

type StorageOperationsDeleteWorkflowParams = StorageOperationsDeleteParams;
type StorageOperationsGetContentReviewParams = StorageOperationsGetParams;
type StorageOperationsListContentReviewsParams = CmsEntryListParams;

interface StorageOperationsCreateContentReviewParams {
    data: CreateApwContentReviewParams;
}

interface StorageOperationsUpdateContentReviewParams {
    id: string;
    data: UpdateApwContentReviewParams;
}

type StorageOperationsDeleteContentReviewParams = StorageOperationsDeleteParams;

type StorageOperationsGetChangeRequestParams = StorageOperationsGetParams;
type StorageOperationsListChangeRequestsParams = CmsEntryListParams;

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
type StorageOperationsListCommentsParams = CmsEntryListParams;

interface StorageOperationsCreateCommentParams {
    data: CreateApwCommentParams;
}

interface StorageOperationsUpdateCommentParams {
    id: string;
    data: UpdateApwCommentParams;
}

export interface ApwStorageOperations {
    /*
     * Reviewer methods
     */
    getReviewerModel(): Promise<CmsModel>;

    getReviewer(params: StorageOperationsGetReviewerParams): Promise<ApwReviewer>;

    listReviewers(
        params: StorageOperationsListReviewersParams
    ): Promise<[ApwReviewer[], CmsEntryMeta]>;

    createReviewer(params: StorageOperationsCreateReviewerParams): Promise<ApwReviewer>;

    updateReviewer(params: StorageOperationsUpdateReviewerParams): Promise<ApwReviewer>;

    deleteReviewer(params: StorageOperationsDeleteReviewerParams): Promise<Boolean>;

    /*
     * Workflow methods
     */
    getWorkflowModel(): Promise<CmsModel>;

    getWorkflow(params: StorageOperationsGetWorkflowParams): Promise<ApwWorkflow>;

    listWorkflows(
        params: StorageOperationsListWorkflowsParams
    ): Promise<[ApwWorkflow[], CmsEntryMeta]>;

    createWorkflow(params: StorageOperationsCreateWorkflowParams): Promise<ApwWorkflow>;

    updateWorkflow(params: StorageOperationsUpdateWorkflowParams): Promise<ApwWorkflow>;

    deleteWorkflow(params: StorageOperationsDeleteWorkflowParams): Promise<Boolean>;

    /*
     * ContentReview methods
     */
    getContentReviewModel(): Promise<CmsModel>;

    getContentReview(params: StorageOperationsGetContentReviewParams): Promise<ApwContentReview>;

    listContentReviews(
        params: StorageOperationsListContentReviewsParams
    ): Promise<[ApwContentReview[], CmsEntryMeta]>;

    createContentReview(
        params: StorageOperationsCreateContentReviewParams
    ): Promise<ApwContentReview>;

    updateContentReview(
        params: StorageOperationsUpdateContentReviewParams
    ): Promise<ApwContentReview>;

    deleteContentReview(params: StorageOperationsDeleteContentReviewParams): Promise<Boolean>;

    /*
     * ChangeRequest methods
     */
    getChangeRequestModel(): Promise<CmsModel>;

    getChangeRequest(params: StorageOperationsGetChangeRequestParams): Promise<ApwChangeRequest>;

    listChangeRequests(
        params: StorageOperationsListChangeRequestsParams
    ): Promise<[ApwChangeRequest[], CmsEntryMeta]>;

    createChangeRequest(
        params: StorageOperationsCreateChangeRequestParams
    ): Promise<ApwChangeRequest>;

    updateChangeRequest(
        params: StorageOperationsUpdateChangeRequestParams
    ): Promise<ApwChangeRequest>;

    deleteChangeRequest(params: StorageOperationsDeleteChangeRequestParams): Promise<Boolean>;

    /*
     * Comment methods
     */
    getCommentModel(): Promise<CmsModel>;

    getComment(params: StorageOperationsGetCommentParams): Promise<ApwComment>;

    listComments(
        params: StorageOperationsListCommentsParams
    ): Promise<[ApwComment[], CmsEntryMeta]>;

    createComment(params: StorageOperationsCreateCommentParams): Promise<ApwComment>;

    updateComment(params: StorageOperationsUpdateCommentParams): Promise<ApwComment>;

    deleteComment(params: StorageOperationsDeleteCommentParams): Promise<Boolean>;
}
