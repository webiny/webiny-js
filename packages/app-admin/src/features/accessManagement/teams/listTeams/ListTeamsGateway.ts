import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Team } from "../../types.js";
import {
    ListTeamsGateway as GatewayAbstraction,
    type IListTeamsGatewayResult
} from "./abstractions.js";

const TEAM_FIELDS = `
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
`;

const LIST_TEAMS = /* GraphQL */ `
    query listTeams {
        security {
            teams: listTeams {
                data {
                    ${TEAM_FIELDS}
                }
            }
        }
    }
`;

interface ListTeamsResponse {
    security: {
        teams: {
            data: Team[];
        };
    };
}

class ListTeamsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IListTeamsGatewayResult> {
        const response = await this.client.execute<ListTeamsResponse>({
            query: LIST_TEAMS
        });

        return { data: response.security.teams.data ?? [] };
    }
}

export const ListTeamsGateway = GatewayAbstraction.createImplementation({
    implementation: ListTeamsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
