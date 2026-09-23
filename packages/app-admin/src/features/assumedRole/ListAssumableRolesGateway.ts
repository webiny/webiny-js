import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ListAssumableRolesGateway as Abstraction } from "./abstractions.js";
import { ASSUME_ROLE_HEADER } from "./assumeRoleHeader.js";

const ROLES_FIELD = /* GraphQL */ `
    roles: listRoles {
        data {
            id
            name
            description
            permissions
        }
        error {
            message
        }
    }
`;

const TEAMS_FIELD = /* GraphQL */ `
    teams: listTeams {
        data {
            id
            name
            description
            roles {
                id
            }
        }
        error {
            message
        }
    }
`;

const LIST_ROLES = /* GraphQL */ `
    query ListAssumableRoles {
        security {
            ${ROLES_FIELD}
        }
    }
`;

const LIST_ROLES_AND_TEAMS = /* GraphQL */ `
    query ListAssumableRolesAndTeams {
        security {
            ${ROLES_FIELD}
            ${TEAMS_FIELD}
        }
    }
`;

interface ListResponse<T> {
    data: T[] | null;
    error: { message: string } | null;
}

interface Response {
    security: {
        roles: ListResponse<Abstraction.Dto["roles"][number]>;
        teams?: ListResponse<Abstraction.Dto["teams"][number]>;
    };
}

function unwrap<T>(response: ListResponse<T> | undefined): T[] {
    if (!response) {
        return [];
    }

    if (response.error) {
        throw new Error(response.error.message);
    }

    return response.data ?? [];
}

class ListAssumableRolesGatewayImpl implements Abstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: { includeTeams: boolean }): Promise<Abstraction.Dto> {
        const query = params.includeTeams ? LIST_ROLES_AND_TEAMS : LIST_ROLES;

        /*
         * An explicit, empty assume-role header. The client decorator leaves a header the caller
         * set alone, and the API reads an empty value as "no role assumed", so this one request
         * runs as the signed-in user even while the rest of the Admin runs as the previewed role.
         */
        const response = await this.client.execute<Response>({
            query,
            headers: { [ASSUME_ROLE_HEADER]: "" }
        });

        const roles = unwrap(response.security.roles);
        const teams = unwrap(response.security.teams);

        return { roles, teams };
    }
}

export const ListAssumableRolesGateway = Abstraction.createImplementation({
    implementation: ListAssumableRolesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
