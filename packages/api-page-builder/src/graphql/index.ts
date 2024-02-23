export { useElementVariables } from "./elementProcessors/useElementVariables";

import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { createCrud, CreateCrudParams } from "./crud";
import graphql from "./graphql";
import { createElementProcessors } from "~/graphql/elementProcessors";
import settingsPlugins from "~/plugins/settings";

export const createPageBuilderGraphQL = (): GraphQLSchemaPlugin[] => {
    return graphql();
};

export type ContextParams = CreateCrudParams;
export const createPageBuilderContext = (params: ContextParams) => {
    return [createCrud(params), createElementProcessors(), settingsPlugins];
};
