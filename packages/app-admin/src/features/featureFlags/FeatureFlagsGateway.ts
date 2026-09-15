import { createImplementation } from "@webiny/di";
import { FeatureFlagsGateway as Abstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";

interface GetFeatureFlagsResponse {
    featureFlags: {
        data: IFeatureFlagsDto | null;
        error: { message: string; code: string; data: unknown } | null;
    };
}

const GET_FEATURE_FLAGS = /* GraphQL */ `
    query GetFeatureFlags {
        featureFlags {
            data
            error {
                message
                code
                data
            }
        }
    }
`;

class FeatureFlagsGraphQLGateway implements Abstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async fetchFlags(): Promise<IFeatureFlagsDto | null> {
        const response = await this.client.execute<GetFeatureFlagsResponse>({
            query: GET_FEATURE_FLAGS,
            headers: {
                "x-tenant": "root"
            }
        });

        if (response.featureFlags.error) {
            throw new Error(response.featureFlags.error.message);
        }

        return response.featureFlags.data;
    }
}

export const FeatureFlagsGateway = createImplementation({
    abstraction: Abstraction,
    implementation: FeatureFlagsGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
