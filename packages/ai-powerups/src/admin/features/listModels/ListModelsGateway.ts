import { z } from "zod";
import { ListModelsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/exports/admin.js";
import type { AiModel } from "./abstractions.js";

const dateField = z.coerce
    .date()
    .nullable()
    .optional()
    .transform(v => v ?? undefined);

const schema = z.array(
    z.object({
        providerId: z.string(),
        providerName: z.string(),
        modelId: z.string(),
        modelName: z.string(),
        deprecated: dateField,
        endOfLife: dateField
    })
);

const LIST_MODELS = /* GraphQL */ `
    query ListModels {
        aiPowerUps {
            listModels {
                providerId
                providerName
                modelId
                modelName
                deprecated
                endOfLife
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

        const result = schema.safeParse(response.aiPowerUps.listModels);
        if (!result.success) {
            console.error(result.error);
            return [];
        }
        return result.data;
    }
}

export const ListModelsGateway = GatewayAbstraction.createImplementation({
    implementation: ListModelsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
