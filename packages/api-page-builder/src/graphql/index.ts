import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { createCrud, CreateCrudParams } from "./crud";
import graphql from "./graphql";

export const createPageBuilderGraphQL = (): GraphQLSchemaPlugin[] => {
    return graphql();
};

export type ContextParams = CreateCrudParams;
export const createPageBuilderContext = (params: ContextParams) => {
    return [createCrud(params)];
};

export * from "./crud/pages/PageContent";
export * from "./crud/pages/PageElementId";
