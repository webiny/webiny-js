import type { AcoContext } from "~/types.js";
import type { IListIdentityTeamsGateway } from "./IListIdentityTeamsGateway.js";

export class ListIdentityTeamsGatewayFromContext implements IListIdentityTeamsGateway {
    private context: AcoContext;

    constructor(context: AcoContext) {
        this.context = context;
    }

    async execute() {
        return this.context.security.withoutAuthorization(async () => {
            const identity = this.context.security.getIdentity();
            if (!identity) {
                return [];
            }

            const adminUser = await this.context.adminUsers.getUser({
                where: { id: identity.id }
            });
            if (!adminUser) {
                return [];
            }

            const hasTeams = adminUser.teams && adminUser.teams.length > 0;
            if (hasTeams) {
                return this.context.security.listTeams({
                    where: { id_in: adminUser.teams }
                });
            }

            return [];
        });
    }
}
