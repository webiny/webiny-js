import { GenerateEntryContentGateway as GatewayAbstraction } from "./abstractions.js";
import type { GenerateEntryContentParams } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/exports/admin.js";

const GENERATE_ENTRY_CONTENT = /* GraphQL */ `
    mutation GenerateEntryContent(
        $prompt: String!
        $modelId: String!
        $projectId: String
        $excludedFileIds: [String!]
        $readerPersonaId: String
        $writerPersonaId: String
        $additionalFileIds: [String!]
    ) {
        aiPowerUps {
            generateEntryContent(
                prompt: $prompt
                modelId: $modelId
                projectId: $projectId
                excludedFileIds: $excludedFileIds
                readerPersonaId: $readerPersonaId
                writerPersonaId: $writerPersonaId
                additionalFileIds: $additionalFileIds
            )
        }
    }
`;

type GenerateEntryContentResponse = {
    aiPowerUps: {
        generateEntryContent: { id: string };
    };
};

class GenerateEntryContentGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: GenerateEntryContentParams): Promise<void> {
        await this.client.execute<GenerateEntryContentResponse>({
            query: GENERATE_ENTRY_CONTENT,
            variables: params
        });
    }
}

export const GenerateEntryContentGateway = GatewayAbstraction.createImplementation({
    implementation: GenerateEntryContentGatewayImpl,
    dependencies: [MainGraphQLClient]
});
