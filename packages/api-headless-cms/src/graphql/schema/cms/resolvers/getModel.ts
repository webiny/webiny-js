import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { createGetModelResolver } from "../getModelResolver.js";

class GetModelResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/GetModelResolver");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "CmsQuery.getModel",
            resolver: createGetModelResolver
        });

        return builder;
    }
}

export const GetModelResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: GetModelResolver,
    dependencies: []
});
