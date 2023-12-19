import { CmsContext, HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";

import { createFilterOperations } from "~/filter/filter.so";
import { createFolderOperations } from "~/folder/folder.so";
import { createSearchRecordOperations } from "~/record/record.so";
import { createAcoModels } from "~/createAcoModels";

import { AcoStorageOperations } from "~/types";

export interface CreateAcoStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    getCmsContext: () => CmsContext;
}

export const baseFields = [
    "id",
    "entryId",

    // On/by fields are mapped to entry-level fields (we use ":" to signal that).
    "entryCreatedOn:createdOn",
    "entryModifiedOn:modifiedOn",
    "entrySavedOn:savedOn",
    "entryCreatedBy:createdBy",
    "entryModifiedBy:modifiedBy",
    "entrySavedBy:savedBy"
];

export const createAcoStorageOperations = (
    params: CreateAcoStorageOperationsParams
): AcoStorageOperations => {
    const context = params.getCmsContext();

    createAcoModels(context);

    return {
        ...createFolderOperations(params),
        ...createSearchRecordOperations(params),
        ...createFilterOperations(params)
    };
};
