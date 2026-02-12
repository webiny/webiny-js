import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createDeleteEntryRevisionResolver } from "../deleteEntryResolver.js";

class DeleteEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.deleteEntryRevision",
            resolver: createDeleteEntryRevisionResolver
        });

        return builder;
    }
}

export const DeleteEntryRevisionResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: DeleteEntryRevisionResolver,
    dependencies: []
});
