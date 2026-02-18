import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createListEntriesResolver } from "../listEntriesResolver.js";

class ListEntriesResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsQuery.listEntries",
            resolver: createListEntriesResolver
        });

        return builder;
    }
}

export const ListEntriesResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ListEntriesResolver,
    dependencies: []
});
