import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createCreateEntryResolver } from "../createEntryResolver.js";

class CreateEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.createEntry",
            resolver: createCreateEntryResolver
        });

        return builder;
    }
}

export const CreateEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CreateEntryResolver,
    dependencies: []
});
