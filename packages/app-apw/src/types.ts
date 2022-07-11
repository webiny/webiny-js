import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";

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

export enum ApwWorkflowScopeTypes {
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

export enum ApwContentTypes {
    PAGE = "page",
    CMS_ENTRY = "cms_entry"
}

export interface ApwWorkflowScope {
    type: ApwWorkflowScopeTypes;
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
    reviewers: string[];
}

export interface ApwContentReviewStep extends ApwWorkflowStep {
    id: string;
    status: ApwContentReviewStepStatus;
    pendingChangeRequests: number;
    signOffProvidedOn: string | null;
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

export interface PbCategory {
    slug: string;
    name: string;
}

export interface PbPage {
    id: string;
    title: string;
}

export interface ApwContentReviewContent {
    id: string;
    type: ApwContentTypes;
    version: number;
    settings: {
        modelId?: string;
    };
    scheduledOn: string | null;
    scheduledBy: CreatedBy | null;
    publishedOn: string | null;
    publishedBy: CreatedBy | null;
}

export interface ApwContentReview extends BaseFields {
    title: string;
    status: ApwContentReviewStatus;
    content: ApwContentReviewContent;
    steps: Array<ApwContentReviewStep>;
}

export interface ApwContentReviewListItem extends BaseFields {
    title: string;
    steps: [ApwContentReviewStep];
    content: ApwContentReviewContent;
    status: ApwContentReviewStatus;
    activeStep: ApwContentReviewStep;
    totalComments: number;
    latestCommentId: string;
    reviewers: [string];
}

export enum ApwChangeRequestStatus {
    ACTIVE = "active",
    PENDING = "pending",
    RESOLVED = "resolved"
}

export interface ApwChangeRequest extends BaseFields {
    title: string;
    body: RichTextEditorProps["value"];
    media: any;
    resolved: boolean;
}

export interface ApwComment extends BaseFields {
    body: RichTextEditorProps["value"];
    changeRequest: string;
    media?: ApwMediaFile;
}

export interface ApwMediaFile {
    name: string;
    src: string;
    id: string;
}

export interface ApwWorkflow extends BaseFields {
    title: string;
    steps: ApwWorkflowStep[];
    scope: ApwWorkflowScope;
    app: ApwWorkflowApplications;
}

export interface CmsModel {
    name: string;
    modelId: string;
}
export interface CmsEntry {
    entryId: string;
    title: string;
    model: {
        modelId: string;
        name: string;
    };
}
