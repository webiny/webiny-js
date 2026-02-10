import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class QueryCmsResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "Query.cms",
            resolver() {
                /**
                 * Returns an empty object that serves as a namespace for CMS queries.
                 * Actual query operations (getEntry, getEntryById, listEntries, etc.) are resolved
                 * by dedicated resolvers registered under the CmsQuery type.
                 */
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
