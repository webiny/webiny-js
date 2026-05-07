import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createAcoContext } from "~/createAcoContext.js";
import { createAcoGraphQL } from "~/createAcoGraphQL.js";
import { createAcoTasks } from "~/createAcoTasks.js";
import type { AcoStorageOperationsFactory } from "~/createAcoContext.js";

export { FILTER_MODEL_ID } from "./filter/filter.model.js";
export type { AcoStorageOperationsFactory } from "~/createAcoContext.js";

/**
 * Public params for `createAco`. Either `documentClient` (legacy serverless
 * path) or `storageOperationsFactory` (new container-friendly path) must be
 * provided. If both are set, the factory wins.
 */
export interface CreateAcoParams {
    /**
     * @deprecated Pass `storageOperationsFactory` instead. Kept for
     * backwards compatibility — supplying `documentClient` builds an
     * internal DDB-backed factory. Will be removed in a future major.
     */
    documentClient?: DynamoDBDocument;
    /**
     * Factory that builds ACO storage operations from the request-scoped CMS
     * context. Container deployments supply a SQLite-backed factory; the
     * serverless path can either keep using `documentClient` or migrate to
     * a factory that wraps the existing DDB ops.
     */
    storageOperationsFactory?: AcoStorageOperationsFactory;
    useFolderLevelPermissions?: boolean;
}

export const createAco = (params: CreateAcoParams) => {
    return [createAcoContext(params), ...createAcoGraphQL(), createAcoTasks()];
};

export * from "./folder/createFolderModelModifier.js";
