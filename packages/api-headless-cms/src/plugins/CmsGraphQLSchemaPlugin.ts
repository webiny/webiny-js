import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

export class CmsGraphQLSchemaPlugin<T = CmsContext> extends GraphQLSchemaPlugin<T> {
    public static override type = "cms.graphql.schema";
}
