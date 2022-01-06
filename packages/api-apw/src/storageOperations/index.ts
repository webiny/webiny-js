import pick from "lodash/pick";
import { CmsContext, HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";
import { createReviewerStorageOperations } from "./reviewerStorageOperations";
import { createWorkflowStorageOperations } from "./workflowStorageOperations";
import { createContentReviewStorageOperations } from "./contentReviewStorageOperations";
import { createChangeRequestStorageOperations } from "./changeRequestStorageOperations";
import { createCommentStorageOperations } from "~/storageOperations/commentStorageOperations";

export interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
    getCmsContext: () => CmsContext;
}

export function getFieldValues(object, fields) {
    return { ...pick(object, fields), ...object.values };
}

export const baseFields = ["id", "createdBy", "createdOn", "savedOn"];

export const createStorageOperations = ({
    cms,
    getCmsContext
}: CreateApwStorageOperationsParams): ApwStorageOperations => {
    return {
        ...createReviewerStorageOperations({ cms }),
        ...createWorkflowStorageOperations({ cms }),
        ...createContentReviewStorageOperations({ cms }),
        ...createChangeRequestStorageOperations({ cms, getCmsContext }),
        ...createCommentStorageOperations({
            cms,
            getCmsContext
        })
    };
};
