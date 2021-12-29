import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { createCrud, Params as CrudParams } from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import multiTenancy from "./multiTenancy";

export const createPageBuilderGraphQL = (): GraphQLSchemaPlugin[] => {
    return graphql();
};

export type ContextParams = CrudParams;
export const createPageBuilderContext = (params: ContextParams) => {
    return [createCrud(params), upgrades(), multiTenancy()];
};
