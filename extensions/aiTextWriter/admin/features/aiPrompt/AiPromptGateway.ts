import { AiPromptGateway as Gateway, type IAiPromptInput } from "./abstractions.js";
import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";

interface AiPromptResponse {
    aiTextWriter: string;
}

class AiPromptGatewayImpl implements Gateway.Interface {
    constructor(private client: GraphQLClient.Interface) {}

    async prompt(input: IAiPromptInput[]): Promise<string> {
        const response = await this.client.execute<AiPromptResponse>({
            query: `{ aiTextWriter }`
        });

        const aiResponse = response.aiTextWriter;

        return aiResponse;
    }
}

export const AiPromptGateway = Gateway.createImplementation({
    implementation: AiPromptGatewayImpl,
    dependencies: [GraphQLClient]
});
