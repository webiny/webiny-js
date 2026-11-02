import type { IGetDefaultPermissions } from "./IGetDefaultPermissions.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { Team } from "@webiny/api-core/types/security.js";

interface LoadedTeams {
    identityId: string;
    teams: Promise<Team[]>;
}

export class GetDefaultPermissionsWithTeams implements IGetDefaultPermissions {
    private identityContext: IdentityContext.Interface;
    private listUserTeamsUseCase: ListUserTeamsUseCase.Interface;
    private decoretee: IGetDefaultPermissions;
    /**
     * The identity's teams, loaded once per instance and identity. An instance lives for one
     * `getDefaultPermissions` call or one `listFolderLevelPermissions` call, so nothing is kept
     * between calls or requests.
     */
    private loaded: LoadedTeams | null = null;

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

        // Get teams for current identity (once per instance and identity).
        if (!this.loaded || this.loaded.identityId !== identity.id) {
            this.loaded = {
                identityId: identity.id,
                teams: this.listUserTeamsUseCase.execute(identity.id).then(result => {
                    return result.isOk() ? result.value : [];
                })
            };
        }
        const identityTeams: Team[] = await this.loaded.teams;

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
