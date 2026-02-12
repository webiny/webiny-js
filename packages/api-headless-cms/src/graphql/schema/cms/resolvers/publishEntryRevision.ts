import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createPublishEntryRevisionResolver } from "../publishEntryResolver.js";

class PublishEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.publishEntryRevision",
            resolver: createPublishEntryRevisionResolver
        });

        return builder;
    }
}

export const PublishEntryRevisionResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: PublishEntryRevisionResolver,
    dependencies: []
});
