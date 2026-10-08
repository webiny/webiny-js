import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createPublishEntryRevisionResolver } from "../publishEntryResolver.js";

class PublishEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/PublishEntryRevisionResolver");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsMutation.publishEntryRevision",
            resolver: createPublishEntryRevisionResolver
        });

        return builder;
    }
}

export const PublishEntryRevisionResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: PublishEntryRevisionResolver,
    dependencies: []
});
