import { createFeature } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { DynamoDBClientFeature } from "~/feature/DynamoDBClient/index.js";
import { FilterUtilFeature } from "~/feature/FilterUtil/index.js";

export interface DynamoDBCoreFeatureConfig {
    documentClient: DynamoDBDocument;
}

/**
 * Registers the DynamoDB document client abstraction + the DDB filter/query utilities that CMS entry
 * filtering depends on. The Feature-style counterpart to `registerDynamoDBCore` (which does the same
 * registrations as a RegisterExtensionPlugin). Previously lived in `@webiny/handler-db` as `DbFeature`.
 */
export const DynamoDBCoreFeature = createFeature<DynamoDBCoreFeatureConfig>({
    name: "DynamoDBCore",
    register(container, { documentClient }) {
        DynamoDBClientFeature.register(container, documentClient);
        FilterUtilFeature.register(container);
        ValueFilterFeature.register(container);
    }
});
