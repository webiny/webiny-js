import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Team } from "../../types.js";
import { GetTeamGateway as GatewayAbstraction } from "./abstractions.js";

const GET_TEAM = /* GraphQL */ `
    query getTeam($id: ID!) {
        security {
            team: getTeam(where: { id: $id }) {
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
                }
            }
        }
    }
`;

interface GetTeamResponse {
    security: {
        team: {
            data: Team | null;
            error: { code: string; message: string } | null;
        };
    };
}

class GetTeamGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<Team> {
        const response = await this.client.execute<GetTeamResponse>({
            query: GET_TEAM,
            variables: { id }
        });

        const { data, error } = response.security.team;

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            throw new Error("Team not found.");
        }

        return data;
    }
}

export const GetTeamGateway = GatewayAbstraction.createImplementation({
    implementation: GetTeamGatewayImpl,
    dependencies: [MainGraphQLClient]
});
