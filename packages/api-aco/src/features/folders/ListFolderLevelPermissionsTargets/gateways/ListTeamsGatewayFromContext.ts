import type { ListTeamsGateway } from "../abstractions.js";
import type { Security, Team } from "@webiny/api-security/types.js";

export class ListTeamsGatewayFromContext implements ListTeamsGateway.Interface {
    constructor(private security: Security) {}

    public async execute(): Promise<Team[]> {
        return this.security.withoutAuthorization(async () => {
            return this.security.listTeams();
        });
    }
}
