import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Role } from "../../types.js";
import { CreateRoleGateway as GatewayAbstraction, type ICreateRoleData } from "./abstractions.js";

const CREATE_ROLE = /* GraphQL */ `
    mutation createRole($data: SecurityRoleCreateInput!) {
        security {
            role: createRole(data: $data) {
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

interface CreateRoleResponse {
    security: {
        role: {
            data: Role | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class CreateRoleGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: ICreateRoleData): Promise<Role> {
        const response = await this.client.execute<CreateRoleResponse>({
            query: CREATE_ROLE,
            variables: { data }
        });

        const { data: role, error } = response.security.role;

        if (error) {
            throw new Error(error.message);
        }

        if (!role) {
            throw new Error("Failed to create role.");
        }

        return role;
    }
}

export const CreateRoleGateway = GatewayAbstraction.createImplementation({
    implementation: CreateRoleGatewayImpl,
    dependencies: [MainGraphQLClient]
});
