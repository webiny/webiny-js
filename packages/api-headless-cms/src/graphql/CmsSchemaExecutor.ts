import { createAbstraction } from "@webiny/feature/api";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLRequestBody } from "@webiny/handler-graphql/types.js";
import type { ExecutionResult } from "graphql";

export interface ICmsSchemaExecutor {
    execute(
        type: ApiEndpoint,
        body: GraphQLRequestBody | GraphQLRequestBody[]
    ): Promise<ExecutionResult | ExecutionResult[]>;
}

export const CmsSchemaExecutor = createAbstraction<ICmsSchemaExecutor>("CmsSchemaExecutor");

export namespace CmsSchemaExecutor {
    export type Interface = ICmsSchemaExecutor;
}
