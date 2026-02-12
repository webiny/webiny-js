import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createGetEntryRevisionByIdResolver } from "../getEntryByIdResolver.js";

class GetEntryRevisionByIdResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsQuery.getEntryRevisionById",
            resolver: createGetEntryRevisionByIdResolver
        });

        return builder;
    }
}

export const GetEntryRevisionByIdResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: GetEntryRevisionByIdResolver,
    dependencies: []
});
