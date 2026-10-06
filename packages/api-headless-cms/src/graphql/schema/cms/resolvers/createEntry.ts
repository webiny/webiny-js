import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createCreateEntryResolver } from "../createEntryResolver.js";

class CreateEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/CreateEntryResolver");

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
