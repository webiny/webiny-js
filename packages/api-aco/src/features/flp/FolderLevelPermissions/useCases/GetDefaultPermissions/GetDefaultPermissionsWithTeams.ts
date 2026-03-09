import type { IGetDefaultPermissions } from "./IGetDefaultPermissions.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import type { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/ListUserTeams";
import type { Team } from "@webiny/api-core/types/security.js";

export class GetDefaultPermissionsWithTeams implements IGetDefaultPermissions {
    private identityContext: IdentityContext.Interface;
    private listUserTeamsUseCase: ListUserTeamsUseCase.Interface;
    private decoretee: IGetDefaultPermissions;

    constructor(
        identityContext: IdentityContext.Interface,
        listUserTeamsUseCase: ListUserTeamsUseCase.Interface,
        decoretee: IGetDefaultPermissions
    ) {
        this.identityContext = identityContext;
        this.listUserTeamsUseCase = listUserTeamsUseCase;
        this.decoretee = decoretee;
    }

    async execute(originalPermissions: FolderPermission[]) {
        /**
         * Retrieves the list of teams the current identity belongs to and checks if any of these teams
         * have permissions for the folder. If a team has permissions, the current identity is granted
         * the same permissions, inheriting them from the team.
         */
        const identity = this.identityContext.getIdentity();

        // Get teams for current identity
        const listTeamsResult = await this.listUserTeamsUseCase.execute(identity.id);
        const identityTeams: Team[] = listTeamsResult.isOk() ? listTeamsResult.value : [];

        const permissions = [...originalPermissions]; // Clone the original permissions to avoid mutation.

        if (identity && identityTeams.length) {
            for (const identityTeam of identityTeams) {
                // Check if the team has permissions for the folder.
                const teamPermission = permissions.find(
                    p => p.target === `team:${identityTeam.slug}`
                );

                if (teamPermission) {
                    // Grant the current identity the same permissions as the team, marking them as inherited.
                    permissions.push({
                        target: `admin:${identity.id}`,
                        level: teamPermission.level,
                        inheritedFrom: "team:" + identityTeam.slug
                    });
                }
            }
        }

        return await this.decoretee.execute(permissions);
    }
}
