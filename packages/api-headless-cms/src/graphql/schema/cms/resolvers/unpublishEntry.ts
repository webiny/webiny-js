import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createUnpublishEntryRevisionResolver } from "../unpublishEntryResolver.js";

class UnpublishEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.unpublishEntryRevision",
            resolver: createUnpublishEntryRevisionResolver
        });

        return builder;
    }
}

export const UnpublishEntryRevisionResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: UnpublishEntryRevisionResolver,
    dependencies: []
});
