import { GetSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const GET_SETTINGS = /* GraphQL */ `
    query GetAiPowerUpsSettings {
        aiPowerUps {
            getSettings {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

type GetSettingsResponse = {
    aiPowerUps: {
        getSettings:
            | { data: Record<string, any>; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<Record<string, any>> {
        return {
            providers: {
                presets: [
                    {
                        name: "General purpose",
                        model: "gpt-4o",
                        apiKey: "123"
                    }
                ]
            },
            personas: {
                presets: [
                    {
                        id: "123",
                        name: "Student",
                        description:
                            "You are a student learning new concepts. Explain things simply, ask clarifying questions, and break down complex topics into easy-to-understand language. Avoid jargon and use relatable examples."
                    },
                    {
                        id: "456",
                        name: "Teacher",
                        description:
                            "You are an experienced educator. Provide thorough, well-structured explanations. Use examples and analogies to illustrate key points. Anticipate common misconceptions and address them proactively."
                    }
                ]
            }
        };
        // const response = await this.client.execute<GetSettingsResponse>({
        //     query: GET_SETTINGS
        // });
        //
        // const envelope = response.aiPowerUps.getSettings;
        // if (envelope.error) {
        //     throw new Error(envelope.error.message);
        // }
        //
        // return envelope.data || {};
    }
}

export const GetSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
