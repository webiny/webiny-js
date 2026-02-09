import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class QueryCmsResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "Query.cms",
            resolver() {
                return () => ({});
            }
        });

        return builder;
    }
}

export const QueryCmsResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: QueryCmsResolver,
    dependencies: []
});
