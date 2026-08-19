import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
import { FeatureFlags } from "~/features/featureFlags/abstractions.js";

class FeatureFlagsSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type FeatureFlagsError {
                code: String
                message: String
                data: JSON
            }

            type FeatureFlagsResponse {
                data: JSON
                error: FeatureFlagsError
            }

            extend type Query {
                featureFlags: FeatureFlagsResponse
            }
        `);

        builder.addResolver({
            path: "Query.featureFlags",
            dependencies: [FeatureFlags],
            resolver: (featureFlags: FeatureFlags.Interface) => async () => {
                try {
                    return new Response(featureFlags.get().toDto());
                } catch (e) {
                    return new ErrorResponse({
                        code: "COULD_NOT_GET_FEATURE_FLAGS",
                        message: e.message,
                        data: null,
                        stack: e.stack
                    });
                }
            }
        });

        return builder;
    }
}

export const FeatureFlagsSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: FeatureFlagsSchemaFactoryImpl,
    dependencies: []
});
