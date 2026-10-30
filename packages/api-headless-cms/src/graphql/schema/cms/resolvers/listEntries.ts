import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createListEntriesResolver } from "../listEntriesResolver.js";

class ListEntriesResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/ListEntriesResolver");

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
