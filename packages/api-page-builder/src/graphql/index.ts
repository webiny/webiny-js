export { useElementVariables } from "./elementProcessors/useElementVariables";

import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { createCrud, CreateCrudParams } from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import { createElementProcessors } from "~/graphql/elementProcessors";

export const createPageBuilderGraphQL = (): GraphQLSchemaPlugin[] => {
    return graphql();
};

export type ContextParams = CreateCrudParams;
export const createPageBuilderContext = (params: ContextParams) => {
    return [createCrud(params), upgrades(), createElementProcessors()];
};
