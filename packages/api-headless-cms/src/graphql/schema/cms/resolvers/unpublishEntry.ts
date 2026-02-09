import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createUnpublishEntryResolver } from "../unpublishEntryResolver.js";

class UnpublishEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.unpublishEntry",
            resolver: createUnpublishEntryResolver
        });

        return builder;
    }
}

export const UnpublishEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: UnpublishEntryResolver,
    dependencies: []
});
