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

export interface FieldResolversParams {
    fieldId: string;
    getModel: (context: ApwContext) => Promise<CmsModel>;
    getField: (model: CmsModel, fieldId: string) => CmsModelField;
    isRoot: Boolean;
}

export interface PageWithWorkflow extends Page {
    workflow?: Record<string, any>;
}

export enum WorkflowScopeTypes {
    DEFAULT = "default",
    PB_CATEGORY = "pb_category",
    CMS_MODEL = "cms_model",
    SPECIFIC = "specific"
}

export enum ContentReviewStepStatus {
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

interface ApwWorkflowScope {
    type: WorkflowScopeTypes;
    data: {
        values?: string[];
    };
}

export enum ApwWorkflowStepTypes {
    BLOCKING = "blocking",
    NON_BLOCKING = "non_blocking",
    OPTIONAL = "optional"
}

interface ApwWorkflowSteps {
    title: string;
    type: ApwWorkflowStepTypes;
    reviewers: ApwReviewer[];
}

interface CreateWorkflowParams {
    app: ApwWorkflowApplications;
    title: string;
    scope: ApwWorkflowScope;
    steps: ApwWorkflowSteps;
}

interface UpdateWorkflowParams {
    title?: string;
    scope?: ApwWorkflowScope;
    steps?: ApwWorkflowSteps;
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
}

interface UpdateApwCommentParams {
    body: Record<string, any>;
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

interface AdvancedPublishingWorkflow {
    workflow: ApwWorkflowCrud;
    reviewer: ApwReviewerCrud;
    comment: ApwCommentCrud;
}

export interface ApwContext extends Context, CmsContext {
    advancedPublishingWorkflow: AdvancedPublishingWorkflow;
}
