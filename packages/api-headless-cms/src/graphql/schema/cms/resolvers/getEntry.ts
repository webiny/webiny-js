import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createGetEntryResolver } from "../getEntryResolver.js";

class GetEntryResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/GetEntryResolver");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsQuery.getEntry",
            resolver: createGetEntryResolver
        });

        return builder;
    }
}

export const GetEntryResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: GetEntryResolver,
    dependencies: []
});
