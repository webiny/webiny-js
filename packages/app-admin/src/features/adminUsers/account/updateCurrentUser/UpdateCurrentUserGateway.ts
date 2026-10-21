import { UpdateCurrentUserGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const UPDATE_CURRENT_USER = /* GraphQL */ `
    mutation UpdateCurrentUser($data: AdminUsersCurrentUserInput!) {
        adminUsers {
            updateCurrentUser(data: $data) {
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
                    data
                }
            }
        }
    }
`;

type UpdateCurrentUserResponse = {
    adminUsers: {
        updateCurrentUser:
            | { data: GatewayAbstraction.Result; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdateCurrentUserGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: GatewayAbstraction.Params): Promise<GatewayAbstraction.Result> {
        const response = await this.client.execute<UpdateCurrentUserResponse>({
            query: UPDATE_CURRENT_USER,
            variables: { data: params }
        });

        const { data, error } = response.adminUsers.updateCurrentUser;

        if (!data) {
            throw new Error(error?.message || "Could not update current user.");
        }

        return data;
    }
}

export const UpdateCurrentUserGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateCurrentUserGatewayImpl,
    dependencies: [MainGraphQLClient]
});
