import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Role } from "../../types.js";
import { GetRoleGateway as GatewayAbstraction } from "./abstractions.js";

const GET_ROLE = /* GraphQL */ `
    query getRole($id: ID!) {
        security {
            role: getRole(where: { id: $id }) {
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
                }
            }
        }
    }
`;

interface GetRoleResponse {
    security: {
        role: {
            data: Role | null;
            error: { code: string; message: string } | null;
        };
    };
}

class GetRoleGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<Role> {
        const response = await this.client.execute<GetRoleResponse>({
            query: GET_ROLE,
            variables: { id }
        });

        const { data, error } = response.security.role;

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            throw new Error("Role not found.");
        }

        return data;
    }
}

export const GetRoleGateway = GatewayAbstraction.createImplementation({
    implementation: GetRoleGatewayImpl,
    dependencies: [MainGraphQLClient]
});
