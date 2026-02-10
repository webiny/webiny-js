import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createGetEntryByIdResolver } from "../getEntryByIdResolver.js";

class GetEntryByIdResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsQuery.getEntryById",
            resolver: createGetEntryByIdResolver()
        });

        return builder;
    }
}

export const GetEntryByIdResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: GetEntryByIdResolver,
    dependencies: []
});
