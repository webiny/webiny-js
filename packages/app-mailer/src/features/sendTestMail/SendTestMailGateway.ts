import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { SendTestMailGateway as GatewayAbstraction } from "./abstractions.js";

const SEND_TEST_MAIL = /* GraphQL */ `
    mutation SendTestMail($to: String!) {
        mailer {
            sendTestMail(to: $to) {
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

interface SendTestMailResponse {
    mailer: {
        sendTestMail: {
            data: boolean | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class SendTestMailGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(to: string): Promise<void> {
        const response = await this.client.execute<SendTestMailResponse>({
            query: SEND_TEST_MAIL,
            variables: { to }
        });

        const { error } = response.mailer.sendTestMail;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const SendTestMailGateway = GatewayAbstraction.createImplementation({
    implementation: SendTestMailGatewayImpl,
    dependencies: [MainGraphQLClient]
});
