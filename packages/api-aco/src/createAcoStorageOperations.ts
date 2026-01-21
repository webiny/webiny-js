import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createFilterOperations } from "~/filter/filter.so.js";
import type { AcoStorageOperations } from "~/types.js";
import { createFlpOperations } from "~/flp/index.js";
import type { Security } from "@webiny/api-core/types/security.js";
import type { Container } from "@webiny/di";

export interface CreateAcoStorageOperationsParams {
    cms: HeadlessCms;
    security: Security;
    container: Container;
    documentClient: DynamoDBDocument;
}

export const createAcoStorageOperations = async (
    params: CreateAcoStorageOperationsParams
): Promise<AcoStorageOperations> => {
    return {
        filter: createFilterOperations(params),
        flp: createFlpOperations(params)
    };
};
