import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Role } from "../../types.js";
import {
    ListRolesGateway as GatewayAbstraction,
    type IListRolesGatewayResult
} from "./abstractions.js";

const ROLE_FIELDS = `
    id
    name
    slug
    description
    permissions
    system
    plugin
    createdOn
`;

const LIST_ROLES = /* GraphQL */ `
    query listRoles {
        security {
            roles: listRoles {
                data {
                    ${ROLE_FIELDS}
                }
            }
        }
    }
`;

interface ListRolesResponse {
    security: {
        roles: {
            data: Role[];
        };
    };
}

class ListRolesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IListRolesGatewayResult> {
        const response = await this.client.execute<ListRolesResponse>({
            query: LIST_ROLES
        });

        return { data: response.security.roles.data ?? [] };
    }
}

export const ListRolesGateway = GatewayAbstraction.createImplementation({
    implementation: ListRolesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
