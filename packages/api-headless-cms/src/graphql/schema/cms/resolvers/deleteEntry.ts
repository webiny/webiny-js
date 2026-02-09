import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createDeleteEntryResolver } from "../deleteEntryResolver.js";

class DeleteEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.deleteEntry",
            resolver: createDeleteEntryResolver
        });

        return builder;
    }
}

export const DeleteEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: DeleteEntryResolver,
    dependencies: []
});
