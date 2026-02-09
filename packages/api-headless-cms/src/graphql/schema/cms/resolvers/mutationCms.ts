import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class MutationCmsResolver implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "Mutation.cms",
            resolver() {
                return () => ({});
            }
        });

        return builder;
    }
}

export const MutationCmsResolverImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: MutationCmsResolver,
    dependencies: []
});
