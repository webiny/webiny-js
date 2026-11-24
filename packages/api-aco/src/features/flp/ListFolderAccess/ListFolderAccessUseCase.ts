import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";
import type { Team } from "@webiny/api-core/types/security.js";
import { ListFolderAccessUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderAccess, FolderAccessTeam, FolderAccessUser } from "./abstractions.js";
import { GetFlpUseCase } from "~/features/flp/GetFlp/abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";
import {
    createAccessDirectory,
    createUserAccessProfile,
    getUserFolderLevel
} from "./userFolderLevel.js";

const unrestricted = (folderId: string | null): FolderAccess => ({
    folderId,
    restricted: false,
    users: [],
    teams: []
});

/** For every admin user, the level they would get on the folder (see `getUserFolderLevel`). */
class ListFolderAccessUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getFlp: GetFlpUseCase.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listRoles: ListRolesUseCase.Interface
    ) {}

    async execute(folderId: string | null): UseCaseAbstraction.Return {
        const flags = this.featureFlags.get();
        if (
            !folderId ||
            folderId === ROOT_FOLDER ||
            !flags.isEnabled("advancedAccessControlLayer.folderLevelPermissions")
        ) {
            return Result.ok(unrestricted(folderId));
        }

        const flp = await this.getFlp.execute(folderId);
        const permissions = flp?.permissions ?? [];
        if (permissions.length === 0) {
            return Result.ok(unrestricted(folderId));
        }

        // Who can access a folder is shown to those who can manage its permissions.
        if (this.identityContext.isAuthorizationEnabled()) {
            const canManage = await this.folderLevelPermissions.canManageFolderPermissions({
                ...flp!,
                permissions: await this.folderLevelPermissions.getDefaultPermissions(permissions)
            });
            if (!canManage) {
                return Result.fail(new NotAuthorizedError());
            }
        }

        const teamsEnabled = flags.isEnabled("advancedAccessControlLayer.teams");
        const { users, teams, roles } = await this.identityContext.withoutAuthorization(
            async () => {
                const [users, teams, roles] = await Promise.all([
                    this.listUsers.execute(),
                    this.listTeams.execute(),
                    this.listRoles.execute()
                ]);
                return {
                    users: users.isOk() ? users.value : [],
                    teams: teams.isOk() ? teams.value : [],
                    roles: roles.isOk() ? roles.value : []
                };
            }
        );

        const directory = createAccessDirectory(teams, roles, teamsEnabled);
        const teamsBySlug = new Map<string, Team>(teams.map(team => [team.slug, team]));

        const accessUsers: FolderAccessUser[] = [];
        for (const user of users) {
            const access = getUserFolderLevel(
                createUserAccessProfile(user, directory),
                permissions,
                teamsEnabled
            );
            if (access) {
                accessUsers.push({
                    id: user.id,
                    displayName: user.displayName,
                    email: user.email,
                    ...access
                });
            }
        }

        const accessTeams: FolderAccessTeam[] = permissions
            .filter(p => p.target.startsWith("team:") && p.level !== "no-access")
            .map(p => {
                const slug = p.target.slice("team:".length);
                const team = teamsBySlug.get(slug);
                return {
                    ...(team ? { id: team.id, name: team.name } : {}),
                    slug,
                    level: p.level,
                    ...(p.inheritedFrom ? { inheritedFrom: p.inheritedFrom } : {})
                };
            });

        return Result.ok({
            folderId,
            restricted: true,
            users: accessUsers,
            teams: teamsEnabled ? accessTeams : []
        });
    }
}

export const ListFolderAccessUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFolderAccessUseCaseImpl,
    dependencies: [
        FeatureFlags,
        IdentityContext,
        FolderLevelPermissions,
        GetFlpUseCase,
        ListUsersUseCase,
        ListTeamsUseCase,
        ListRolesUseCase
    ]
});
