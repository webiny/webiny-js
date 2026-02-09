import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createGetEntryResolver } from "../getEntryResolver.js";

class GetEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsQuery.getEntry",
            resolver: createGetEntryResolver
        });

        return builder;
    }
}

export const GetEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: GetEntryResolver,
    dependencies: []
});
