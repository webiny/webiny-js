import { Page } from "@webiny/api-page-builder/types";
import {
    CmsContext,
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel
} from "@webiny/api-headless-cms/types";
import { Context } from "@webiny/handler/types";

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

interface BaseApwCrud {
    getModel(): Promise<CmsModel>;
}

export interface ApwWorkflowCrud extends BaseApwCrud {
    get(id: string): Promise<ApwWorkflow>;

    list(params: ListWorkflowsParams): Promise<[ApwWorkflow[], CmsEntryMeta]>;

    create(data: CreateWorkflowParams): Promise<ApwWorkflow>;

    update(id: string, data: UpdateWorkflowParams): Promise<ApwWorkflow>;

    delete(id: string): Promise<Boolean>;
}

export interface ApwReviewerCrud extends BaseApwCrud {
    get(id: string): Promise<ApwReviewer>;

    list(params: CmsEntryListParams): Promise<[ApwReviewer[], CmsEntryMeta]>;

    create(data: CreateReviewerParams): Promise<ApwReviewer>;

    update(id: string, data: UpdateReviewerParams): Promise<ApwReviewer>;

    delete(id: string): Promise<Boolean>;
}

interface AdvancedPublishingWorkflow {
    workflow: ApwWorkflowCrud;
    reviewer: ApwReviewerCrud;
}

export interface ApwContext extends Context, CmsContext {
    advancedPublishingWorkflow: AdvancedPublishingWorkflow;
}
