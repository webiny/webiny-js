import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { DeleteTeamGateway as GatewayAbstraction } from "./abstractions.js";

const DELETE_TEAM = /* GraphQL */ `
    mutation deleteTeam($id: ID!) {
        security {
            deleteTeam(id: $id) {
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

interface DeleteTeamResponse {
    security: {
        deleteTeam: {
            data: boolean | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class DeleteTeamGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<void> {
        const response = await this.client.execute<DeleteTeamResponse>({
            query: DELETE_TEAM,
            variables: { id }
        });

        const { error } = response.security.deleteTeam;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const DeleteTeamGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteTeamGatewayImpl,
    dependencies: [MainGraphQLClient]
});
