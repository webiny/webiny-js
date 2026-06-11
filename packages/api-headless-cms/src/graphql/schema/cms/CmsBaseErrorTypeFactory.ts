import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

/**
 * Defines the CmsError type in the static schema so that CmsResponseTypeDefsImpl
 * (which references CmsError) can be safely included at schema construction time.
 * CmsError is also defined in the dynamic schema via createBaseSchema() — mergeSchemas
 * handles the duplicate gracefully.
 */
class CmsBaseErrorTypeDefs implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type CmsError {
                message: String!
                code: String
                data: JSON
                stack: String
            }
        `);
        return builder;
    }
}

export const CmsBaseErrorTypeFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CmsBaseErrorTypeDefs,
    dependencies: []
});
