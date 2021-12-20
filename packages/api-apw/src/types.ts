import { Page } from "@webiny/api-page-builder/types";
import {
    CmsContext,
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { Context } from "@webiny/handler/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export interface FieldResolversParams {
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

export type ApwWorkflow = CmsEntry;
export type ApwReviewer = CmsEntry;
export type ApwComment = CmsEntry;
export type ApwChangeRequest = CmsEntry;
export type ApwContentReview = CmsEntry;

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
    where: CmsEntryListParams & {
        app?: ApwWorkflowApplications;
    };
}

interface CreateReviewerParams {
    identityId: string;
    displayName: string;
}

interface UpdateReviewerParams {
    displayName: string;
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
}

interface UpdateApwContentReviewParams {
    steps: JSON;
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
    extends BaseApwCrud<ApwReviewer, CreateReviewerParams, UpdateReviewerParams> {
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

interface AdvancedPublishingWorkflow {
    workflow: ApwWorkflowCrud;
    reviewer: ApwReviewerCrud;
    comment: ApwCommentCrud;
    changeRequest: ApwChangeRequestCrud;
    contentReview: ApwContentReviewCrud;
}

export interface ApwContext extends Context, CmsContext, PbContext {
    apw: AdvancedPublishingWorkflow;
}
