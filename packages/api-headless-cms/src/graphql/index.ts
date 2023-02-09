import { createSystemSchemaPlugin } from "./system";
import { graphQLHandlerFactory, GraphQLHandlerFactoryParams } from "./graphQLHandlerFactory";

export type CreateGraphQLParams = GraphQLHandlerFactoryParams;
export const createGraphQL = (params: CreateGraphQLParams) => {
    return [createSystemSchemaPlugin(), graphQLHandlerFactory(params)];
};
