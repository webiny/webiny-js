import { CmsContext, HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";
import { createReviewerStorageOperations } from "./reviewerStorageOperations";
import { createWorkflowStorageOperations } from "./workflowStorageOperations";
import { createContentReviewStorageOperations } from "./contentReviewStorageOperations";
import { createChangeRequestStorageOperations } from "./changeRequestStorageOperations";
import { createCommentStorageOperations } from "~/storageOperations/commentStorageOperations";
import { createApwModels } from "./models";
import { Security } from "@webiny/api-security/types";

export interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    getCmsContext: () => CmsContext;
}

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
        ...createWorkflowStorageOperations(params),
        ...createContentReviewStorageOperations(params),
        ...createChangeRequestStorageOperations(params),
        ...createCommentStorageOperations(params)
    };
};
