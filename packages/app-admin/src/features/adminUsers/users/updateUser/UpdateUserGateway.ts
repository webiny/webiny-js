import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    UpdateUserGateway as GatewayAbstraction,
    type IUpdateUserGatewayParams,
    type IUpdateUserGatewayResult
} from "./abstractions/index.js";

const UPDATE_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: AdminUsersUpdateInput!) {
        adminUsers {
            user: updateUser(id: $id, data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                    external
                    roles {
                        id
                        slug
                        name
                    }
                    teams {
                        id
                        slug
                        name
                    }
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

type UpdateUserResponse = {
    adminUsers: {
        user:
            | { data: IUpdateUserGatewayResult; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class UpdateUserGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: IUpdateUserGatewayParams): Promise<IUpdateUserGatewayResult> {
        const response = await this.client.execute<UpdateUserResponse>({
            query: UPDATE_USER,
            variables: { id: params.id, data: params.data }
        });

        const envelope = response.adminUsers.user;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const UpdateUserGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateUserGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
