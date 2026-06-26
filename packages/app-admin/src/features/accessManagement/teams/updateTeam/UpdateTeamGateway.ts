import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Team } from "../../types.js";
import { UpdateTeamGateway as GatewayAbstraction, type IUpdateTeamData } from "./abstractions.js";

const UPDATE_TEAM = /* GraphQL */ `
    mutation updateTeam($id: ID!, $data: SecurityTeamUpdateInput!) {
        security {
            team: updateTeam(id: $id, data: $data) {
                data {
                    id
                    name
                    slug
                    description
                    roles {
                        id
                        slug
                        name
                    }
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

interface UpdateTeamResponse {
    security: {
        team: {
            data: Team | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class UpdateTeamGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string, data: IUpdateTeamData): Promise<Team> {
        const response = await this.client.execute<UpdateTeamResponse>({
            query: UPDATE_TEAM,
            variables: { id, data }
        });

        const { data: team, error } = response.security.team;

        if (error) {
            throw new Error(error.message);
        }

        if (!team) {
            throw new Error("Failed to update team.");
        }

        return team;
    }
}

export const UpdateTeamGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateTeamGatewayImpl,
    dependencies: [MainGraphQLClient]
});
