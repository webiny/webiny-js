import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AdminUsersError } from "../shared/AdminUsersError.js";
import {
    ResetUserMfaGateway as GatewayAbstraction,
    type IResetUserMfaGatewayParams
} from "./abstractions/index.js";

const RESET_USER_MFA = /* GraphQL */ `
    mutation ResetUserMfa($id: ID!) {
        adminUsers {
            resetUserMfa(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type ResetUserMfaResponse = {
    adminUsers: {
        resetUserMfa:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class ResetUserMfaGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: IResetUserMfaGatewayParams): Promise<boolean> {
        const response = await this.client.execute<ResetUserMfaResponse>({
            query: RESET_USER_MFA,
            variables: { id: params.id }
        });

        const envelope = response.adminUsers.resetUserMfa;
        if (envelope.error) {
            throw new AdminUsersError(envelope.error);
        }

        return envelope.data;
    }
}

export const ResetUserMfaGateway = GatewayAbstraction.createImplementation({
    implementation: ResetUserMfaGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
