import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createUpdateEntryRevisionResolver } from "../updateEntryResolver.js";

class UpdateEntryRevisionResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/UpdateEntryRevisionResolver");

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
