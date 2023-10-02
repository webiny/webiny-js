import pick from "lodash/pick";
import { CmsContext, CmsEntry, HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";
import { createReviewerStorageOperations } from "./reviewerStorageOperations";
import { createWorkflowStorageOperations } from "./workflowStorageOperations";
import { createContentReviewStorageOperations } from "./contentReviewStorageOperations";
import { createChangeRequestStorageOperations } from "./changeRequestStorageOperations";
import { createCommentStorageOperations } from "~/storageOperations/commentStorageOperations";
import { createApwModels } from "./models";
import { Security } from "@webiny/api-security/types";
import { createReviewersGroupStorageOperations } from "~/storageOperations/reviewsGroupStorageOperations";

export interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    getCmsContext: () => CmsContext;
}

export interface CreateApwReviewersGroupStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    getCmsContext: () => CmsContext;
}

/**
 * Using any because value can be a lot of types.
 * TODO @ts-refactor figure out correct types.
 */
export function getFieldValues(entry: CmsEntry, fields: string[]): any {
    return { ...pick(entry, fields), ...entry.values };
}

export const baseFields = ["id", "entryId", "createdBy", "createdOn", "savedOn"];

export const createStorageOperations = (
    params: CreateApwStorageOperationsParams
): ApwStorageOperations => {
    const context = params.getCmsContext();
    /**
     * Register Apw models.
     */
    createApwModels(context);

    return {
        ...createReviewerStorageOperations(params),
        ...createReviewersGroupStorageOperations(params),
        ...createWorkflowStorageOperations(params),
        ...createContentReviewStorageOperations(params),
        ...createChangeRequestStorageOperations(params),
        ...createCommentStorageOperations(params)
    };
};
