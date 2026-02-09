import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createPublishEntryResolver } from "../publishEntryResolver.js";

class PublishEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.publishEntry",
            resolver: createPublishEntryResolver
        });

        return builder;
    }
}

export const PublishEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: PublishEntryResolver,
    dependencies: []
});
