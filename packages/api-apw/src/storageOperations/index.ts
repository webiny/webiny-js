import pick from "lodash/pick";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";
import { createReviewerStorageOperations } from "./reviewerStorageOperations";
import { createWorkflowStorageOperations } from "./workflowStorageOperations";
import { createContentReviewStorageOperations } from "./contentReviewStorageOperations";
import { createChangeRequestStorageOperations } from "./changeRequestStorageOperations";
import { createCommentStorageOperations } from "~/storageOperations/commentStorageOperations";

export interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
}

export function getFieldValues(object, fields) {
    return { ...pick(object, fields), ...object.values };
}

export const baseFields = ["id", "createdBy", "createdOn", "savedOn"];

export const createStorageOperations = ({
    cms
}: CreateApwStorageOperationsParams): ApwStorageOperations => {
    const changeRequestStorageOperations = createChangeRequestStorageOperations({ cms });
    return {
        ...createReviewerStorageOperations({ cms }),
        ...createWorkflowStorageOperations({ cms }),
        ...createContentReviewStorageOperations({ cms }),
        ...changeRequestStorageOperations,
        ...createCommentStorageOperations({
            cms
        })
    };
};
