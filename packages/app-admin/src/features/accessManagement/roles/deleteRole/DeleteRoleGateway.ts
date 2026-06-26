import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { DeleteRoleGateway as GatewayAbstraction } from "./abstractions.js";

const DELETE_ROLE = /* GraphQL */ `
    mutation deleteRole($id: ID!) {
        security {
            deleteRole(id: $id) {
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

interface DeleteRoleResponse {
    security: {
        deleteRole: {
            data: boolean | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class DeleteRoleGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<void> {
        const response = await this.client.execute<DeleteRoleResponse>({
            query: DELETE_ROLE,
            variables: { id }
        });

        const { error } = response.security.deleteRole;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const DeleteRoleGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteRoleGatewayImpl,
    dependencies: [MainGraphQLClient]
});
