import type { IGetDefaultPermissions } from "./IGetDefaultPermissions.js";
import type {
    IGetIdentityGateway,
    IListIdentityTeamsGateway
} from "~/flp/FolderLevelPermissions/gateways/index.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import type { Team } from "@webiny/api-security/types.js";

export class GetDefaultPermissionsWithTeams implements IGetDefaultPermissions {
    private getIdentityGateway: IGetIdentityGateway;
    private listIdentityTeamsGateway: IListIdentityTeamsGateway;
    private decoretee: IGetDefaultPermissions;

    constructor(
        getIdentityGateway: IGetIdentityGateway,
        listIdentityTeamsGateway: IListIdentityTeamsGateway,
        decoretee: IGetDefaultPermissions
    ) {
        this.getIdentityGateway = getIdentityGateway;
        this.listIdentityTeamsGateway = listIdentityTeamsGateway;
        this.decoretee = decoretee;
    }

    async execute(originalPermissions: FolderPermission[]) {
        /**
         * Retrieves the list of teams the current identity belongs to and checks if any of these teams
         * have permissions for the folder. If a team has permissions, the current identity is granted
         * the same permissions, inheriting them from the team.
         */
        const identity = this.getIdentityGateway.execute();
        const identityTeams: Team[] = (await this.listIdentityTeamsGateway.execute()) ?? [];

        const permissions = [...originalPermissions]; // Clone the original permissions to avoid mutation.

        if (identity && identityTeams.length) {
            for (const identityTeam of identityTeams) {
                // Check if the team has permissions for the folder.
                const teamPermission = permissions.find(
                    p => p.target === `team:${identityTeam.id}`
                );

                if (teamPermission) {
                    // Grant the current identity the same permissions as the team, marking them as inherited.
                    permissions.push({
                        target: `admin:${identity.id}`,
                        level: teamPermission.level,
                        inheritedFrom: "team:" + identityTeam.id
                    });
                }
            }
        }

        return await this.decoretee.execute(permissions);
    }
}
