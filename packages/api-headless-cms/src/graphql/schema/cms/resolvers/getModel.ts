import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { createGetModelResolver } from "../getModelResolver.js";

class GetModelResolver implements CoreGraphQLSchemaFactory.Interface {
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
