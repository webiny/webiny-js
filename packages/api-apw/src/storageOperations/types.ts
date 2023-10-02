import { CmsModel } from "@webiny/api-headless-cms/types";
import {
    ApwChangeRequestStorageOperations as BaseApwChangeRequestStorageOperations,
    ApwCommentStorageOperations as BaseApwCommentStorageOperations,
    ApwContentReviewStorageOperations as BaseApwContentReviewStorageOperations,
    ApwReviewersGroupStorageOperations as BaseApwReviewersGroupStorageOperations,
    ApwReviewerStorageOperations as BaseApwReviewerStorageOperations,
    ApwWorkflowStorageOperations as BaseApwWorkflowStorageOperations
} from "~/types";

export interface ApwCommentStorageOperations extends BaseApwCommentStorageOperations {
    /**
     * @internal
     */
    getCommentModel(): Promise<CmsModel>;
}

export interface ApwReviewerStorageOperations extends BaseApwReviewerStorageOperations {
    /**
     * @internal
     */
    getReviewerModel(): Promise<CmsModel>;
}

export interface ApwReviewersGroupStorageOperations extends BaseApwReviewersGroupStorageOperations {
    /**
     * @internal
     */
    getReviewersGroupModel(): Promise<CmsModel>;
}

export interface ApwWorkflowStorageOperations extends BaseApwWorkflowStorageOperations {
    /**
     * @internal
     */
    getWorkflowModel(): Promise<CmsModel>;
}

export interface ApwContentReviewStorageOperations extends BaseApwContentReviewStorageOperations {
    /**
     * @internal
     */
    getContentReviewModel(): Promise<CmsModel>;
}

export interface ApwChangeRequestStorageOperations extends BaseApwChangeRequestStorageOperations {
    /**
     * @internal
     */
    getChangeRequestModel(): Promise<CmsModel>;
}

export interface ApwStorageOperations
    extends ApwReviewerStorageOperations,
        ApwWorkflowStorageOperations,
        ApwContentReviewStorageOperations,
        ApwChangeRequestStorageOperations,
        ApwCommentStorageOperations {}
