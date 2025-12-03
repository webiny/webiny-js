import type { CmsContext, HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

import { createFilterOperations } from "~/filter/filter.so.js";
import { createAcoModels } from "~/createAcoModels.js";

import type { AcoStorageOperations } from "~/types.js";
import { createFlpOperations } from "~/flp/index.js";
import type { Security } from "@webiny/api-core/types/security.js";

export interface CreateAcoStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    getCmsContext: () => CmsContext;
    documentClient: DynamoDBDocument;
}

export const createAcoStorageOperations = async (
    params: CreateAcoStorageOperationsParams
): Promise<AcoStorageOperations> => {
    const context = params.getCmsContext();

    await createAcoModels(context);

    return {
        filter: createFilterOperations(params),
        flp: createFlpOperations(params)
    };
};
