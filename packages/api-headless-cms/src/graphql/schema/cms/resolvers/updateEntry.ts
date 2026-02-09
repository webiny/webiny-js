import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createUpdateEntryResolver } from "../updateEntryResolver.js";

class UpdateEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.updateEntry",
            resolver: createUpdateEntryResolver
        });

        return builder;
    }
}

export const UpdateEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: UpdateEntryResolver,
    dependencies: []
});
