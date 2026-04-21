import { ListModelsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/exports/admin.js";
import type { AiModel } from "./abstractions.js";

const LIST_MODELS = /* GraphQL */ `
    query ListModels {
        aiPowerUps {
            listModels {
                providerId
                providerName
                modelId
                modelName
            }
        }
    }
`;

type ListModelsResponse = {
    aiPowerUps: {
        listModels: AiModel[];
    };
};

class ListModelsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<AiModel[]> {
        const response = await this.client.execute<ListModelsResponse>({
            query: LIST_MODELS
        });

        return response.aiPowerUps.listModels ?? [];
    }
}

export const ListModelsGateway = GatewayAbstraction.createImplementation({
    implementation: ListModelsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
