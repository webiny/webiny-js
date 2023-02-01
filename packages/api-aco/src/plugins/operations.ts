import { CmsContext, HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";

import { createFolderOperations } from "~/entities/folder/folder.so";
import { createSearchRecordOperations } from "~/entities/record/record.so";
import { createAcoModels } from "~/plugins/models";

import { AcoStorageOperations } from "~/types";

export interface CreateAcoStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    getCmsContext: () => CmsContext;
}

export const baseFields = ["id", "entryId", "createdBy", "createdOn", "savedOn"];

export const createStorageOperations = (
    params: CreateAcoStorageOperationsParams
): AcoStorageOperations => {
    const context = params.getCmsContext();

    createAcoModels(context);

    return {
        ...createFolderOperations(params),
        ...createSearchRecordOperations(params)
    };
};
