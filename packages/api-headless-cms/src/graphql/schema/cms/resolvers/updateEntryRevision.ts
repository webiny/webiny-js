import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { createUpdateEntryRevisionResolver } from "../updateEntryResolver.js";

class UpdateEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.updateEntryRevision",
            resolver: createUpdateEntryRevisionResolver
        });

        return builder;
    }
}

export const UpdateEntryRevisionResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: UpdateEntryRevisionResolver,
    dependencies: []
});
