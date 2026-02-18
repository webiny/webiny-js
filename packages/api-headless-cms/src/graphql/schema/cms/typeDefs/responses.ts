import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class CmsResponseTypeDefs implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsEntryResponse {
                data: JSON
                error: CmsError
            }

            type CmsListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            type CmsListResponse {
                data: [JSON!]
                meta: CmsListMeta
                error: CmsError
            }

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }
        `);

        return builder;
    }
}

export const CmsResponseTypeDefsImpl = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CmsResponseTypeDefs,
    dependencies: []
});
