import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    DeleteUserGateway as GatewayAbstraction,
    type IDeleteUserGatewayParams
} from "./abstractions/index.js";

const DELETE_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        adminUsers {
            deleteUser(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

type DeleteUserResponse = {
    adminUsers: {
        deleteUser:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string } };
    };
};

class DeleteUserGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: IDeleteUserGatewayParams): Promise<boolean> {
        const response = await this.client.execute<DeleteUserResponse>({
            query: DELETE_USER,
            variables: { id: params.id }
        });

        const envelope = response.adminUsers.deleteUser;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const DeleteUserGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteUserGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
