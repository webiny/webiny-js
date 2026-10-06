import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";

class MutationCmsResolver implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/MutationCmsResolver");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addResolver({
            path: "Mutation.cms",
            resolver() {
                /**
                 * Returns an empty object to serve as the namespace for CMS mutations.
                 * Individual mutation fields (createEntry, updateEntry, etc.) are resolved
                 * by their own dedicated resolvers registered under the CmsMutation type.
                 * This pattern provides a clean GraphQL API structure: mutation { cms { createEntry(...) } }
                 */
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
