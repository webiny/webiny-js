import { createAbstraction } from "@webiny/feature/api";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLRequestBody } from "@webiny/api-graphql/types.js";
import type { ExecutionResult } from "graphql";
import type { CmsGraphQLSchemaVariant } from "~/features/graphql/index.js";

export interface ICmsSchemaExecutorOptions {
    /**
     * Executes against a schema variant instead of the default schema.
     */
    variant?: CmsGraphQLSchemaVariant.Interface;
}

export interface ICmsSchemaExecutor {
    execute(
        type: ApiEndpoint,
        body: GraphQLRequestBody | GraphQLRequestBody[],
        options?: ICmsSchemaExecutorOptions
    ): Promise<ExecutionResult | ExecutionResult[]>;
}

export const CmsSchemaExecutor = createAbstraction<ICmsSchemaExecutor>("CmsSchemaExecutor");

export namespace CmsSchemaExecutor {
    export type Interface = ICmsSchemaExecutor;
    export type Options = ICmsSchemaExecutorOptions;
}
