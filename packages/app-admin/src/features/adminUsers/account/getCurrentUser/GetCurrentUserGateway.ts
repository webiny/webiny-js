import { GetCurrentUserGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const GET_CURRENT_USER = /* GraphQL */ `
    query GetCurrentUser {
        adminUsers {
            user: getCurrentUser {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                    external
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

type GetCurrentUserResponse = {
    adminUsers: {
        user:
            | { data: GatewayAbstraction.Result; error: null }
            | { data: null; error: { code: string; message: string } };
    };
};

class GetCurrentUserGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(): Promise<GatewayAbstraction.Result> {
        const response = await this.client.execute<GetCurrentUserResponse>({
            query: GET_CURRENT_USER
        });

        const { data, error } = response.adminUsers.user;

        if (!data) {
            throw new Error(error?.message || "Could not fetch current user.");
        }

        return data;
    }
}

export const GetCurrentUserGateway = GatewayAbstraction.createImplementation({
    implementation: GetCurrentUserGatewayImpl,
    dependencies: [MainGraphQLClient]
});
