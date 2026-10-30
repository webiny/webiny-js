import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";

class CmsResponseTypeDefs implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-headless-cms/CmsResponseTypeDefs");

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

            type CmsModelResponse {
                data: JSON
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
