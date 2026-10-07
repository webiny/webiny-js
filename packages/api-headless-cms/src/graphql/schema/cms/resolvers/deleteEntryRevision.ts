import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createDeleteEntryRevisionResolver } from "../deleteEntryResolver.js";

class DeleteEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/DeleteEntryRevisionResolver");

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
