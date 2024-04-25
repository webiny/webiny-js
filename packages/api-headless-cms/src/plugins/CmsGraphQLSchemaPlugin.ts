import { GraphQLSchemaPlugin, GraphQLSchemaPluginConfig } from "@webiny/handler-graphql";
import { Context } from "@webiny/api/types";
import { CmsContext } from "~/types";

export class CmsGraphQLSchemaPlugin<T = CmsContext> extends GraphQLSchemaPlugin<T> {
    public static override type = "cms.graphql.schema";
}

export const createCmsGraphQLSchemaPlugin = <TContext = Context>(
    params: GraphQLSchemaPluginConfig<TContext>
) => {
    return new CmsGraphQLSchemaPlugin<TContext>(params);
};
