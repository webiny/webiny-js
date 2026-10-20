import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createUnpublishEntryRevisionResolver } from "../unpublishEntryResolver.js";

class UnpublishEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/UnpublishEntryRevisionResolver");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.unpublishEntryRevision",
            resolver: createUnpublishEntryRevisionResolver
        });

        return builder;
    }
}

export const UnpublishEntryRevisionResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: UnpublishEntryRevisionResolver,
    dependencies: []
});
