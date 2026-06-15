import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Team } from "../../types.js";
import { CreateTeamGateway as GatewayAbstraction, type ICreateTeamData } from "./abstractions.js";

const CREATE_TEAM = /* GraphQL */ `
    mutation createTeam($data: SecurityTeamCreateInput!) {
        security {
            team: createTeam(data: $data) {
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

interface CreateTeamResponse {
    security: {
        team: {
            data: Team | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class CreateTeamGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: ICreateTeamData): Promise<Team> {
        const response = await this.client.execute<CreateTeamResponse>({
            query: CREATE_TEAM,
            variables: { data }
        });

        const { data: team, error } = response.security.team;

        if (error) {
            throw new Error(error.message);
        }

        if (!team) {
            throw new Error("Failed to create team.");
        }

        return team;
    }
}

export const CreateTeamGateway = GatewayAbstraction.createImplementation({
    implementation: CreateTeamGatewayImpl,
    dependencies: [MainGraphQLClient]
});
