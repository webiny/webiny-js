import { GeneratePageContentGateway as GatewayAbstraction } from "./abstractions.js";
import type { GeneratePageContentParams } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/exports/admin.js";

const GENERATE_PAGE_CONTENT = /* GraphQL */ `
    mutation GeneratePageContent(
        $prompt: String!
        $components: JSON!
        $tools: JSON!
        $projectId: String
        $excludedFileIds: [String!]
        $readerPersonaId: String
        $writerPersonaId: String
    ) {
        aiPowerUps {
            generatePageContent(
                prompt: $prompt
                components: $components
                tools: $tools
                projectId: $projectId
                excludedFileIds: $excludedFileIds
                readerPersonaId: $readerPersonaId
                writerPersonaId: $writerPersonaId
            )
        }
    }
`;

type GeneratePageContentResponse = {
    aiPowerUps: {
        generatePageContent: { id: string };
    };
};

class GeneratePageContentGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: GeneratePageContentParams): Promise<void> {
        await this.client.execute<GeneratePageContentResponse>({
            query: GENERATE_PAGE_CONTENT,
            variables: params
        });
    }
}

export const GeneratePageContentGateway = GatewayAbstraction.createImplementation({
    implementation: GeneratePageContentGatewayImpl,
    dependencies: [MainGraphQLClient]
});
