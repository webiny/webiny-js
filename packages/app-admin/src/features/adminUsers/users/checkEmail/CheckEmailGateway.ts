import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AdminUsersError } from "../shared/AdminUsersError.js";
import { CheckEmailGateway as GatewayAbstraction, type EmailStatus } from "./abstractions/index.js";

const CHECK_EMAIL = /* GraphQL */ `
    query CheckEmail($email: String!) {
        adminUsers {
            checkEmail(email: $email) {
                data {
                    status
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type CheckEmailResponse = {
    adminUsers: {
        checkEmail:
            | { data: { status: EmailStatus }; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class CheckEmailGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(email: string): Promise<EmailStatus> {
        const response = await this.client.execute<CheckEmailResponse>({
            query: CHECK_EMAIL,
            variables: { email }
        });

        const envelope = response.adminUsers.checkEmail;
        if (envelope.error) {
            throw new AdminUsersError(envelope.error);
        }

        return envelope.data.status;
    }
}

export const CheckEmailGateway = GatewayAbstraction.createImplementation({
    implementation: CheckEmailGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
