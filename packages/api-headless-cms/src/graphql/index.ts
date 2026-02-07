import type { Plugin } from "@webiny/plugins/types.js";
import type { GraphQLHandlerFactoryParams } from "./graphQLHandlerFactory.js";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory.js";
import { createBaseSchema } from "~/graphql/schema/baseSchema.js";
import { createCmsSdkSchema } from "~/graphql/schema/cmsSdk/index.js";

export type CreateGraphQLParams = GraphQLHandlerFactoryParams;
export const createGraphQL = (params: CreateGraphQLParams): Plugin[] => {
    return [createBaseSchema(), createCmsSdkSchema(), ...graphQLHandlerFactory(params)];
};
