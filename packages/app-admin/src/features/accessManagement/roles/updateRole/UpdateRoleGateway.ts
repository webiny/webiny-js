import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Role } from "../../types.js";
import { UpdateRoleGateway as GatewayAbstraction, type IUpdateRoleData } from "./abstractions.js";

const UPDATE_ROLE = /* GraphQL */ `
    mutation updateRole($id: ID!, $data: SecurityRoleUpdateInput!) {
        security {
            role: updateRole(id: $id, data: $data) {
                data {
                    id
                    name
                    slug
                    description
                    permissions
                    system
                    plugin
                    createdOn
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

interface UpdateRoleResponse {
    security: {
        role: {
            data: Role | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class UpdateRoleGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string, data: IUpdateRoleData): Promise<Role> {
        const response = await this.client.execute<UpdateRoleResponse>({
            query: UPDATE_ROLE,
            variables: { id, data }
        });

        const { data: role, error } = response.security.role;

        if (error) {
            throw new Error(error.message);
        }

        if (!role) {
            throw new Error("Failed to update role.");
        }

        return role;
    }
}

export const UpdateRoleGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateRoleGatewayImpl,
    dependencies: [MainGraphQLClient]
});
