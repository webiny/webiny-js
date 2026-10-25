import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { GetDefaultPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/useCases/index.js";
import { GetFlpUseCase } from "@webiny/api-aco/features/flp/GetFlp/index.js";
import type { FolderPermission } from "@webiny/api-aco/types.js";
import { ReviewTeamLoader } from "@webiny/api-workflows/features/identity/ReviewTeamLoader/index.js";
import type { FolderReadRule } from "../FolderReadRule.js";
import { CandidateFolderReadRules as Abstraction } from "./abstractions.js";

const TEAM_TARGET_PREFIX = "team:";

class CandidateFolderReadRulesImpl implements Abstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private teamLoader: ReviewTeamLoader.Interface,
        // Registered with ACO's folder-level permissions; absent with the no-op ones.
        private getFlp?: GetFlpUseCase.Interface
    ) {}

    public create(params: Abstraction.Params): FolderReadRule {
        const usersById = new Map(params.users.map(user => [user.id, user]));
        // Read once, on the first check, and shared by every candidate of the rule.
        let stored: Promise<FolderPermission[]> | null = null;
        let teamSlugs: Promise<Map<string, string>> | null = null;

        const loadStored = (): Promise<FolderPermission[]> => {
            if (!stored && this.getFlp) {
                stored = this.getFlp.execute(params.folderId).then(flp => flp?.permissions ?? []);
            }
            return stored ?? Promise.resolve([]);
        };
        const loadTeamSlugs = (): Promise<Map<string, string>> => {
            if (!teamSlugs) {
                const teamIds = params.users.flatMap(user => user.teams ?? []);
                teamSlugs = this.teamLoader.load(teamIds).then(loaded => {
                    // A failed lookup grants no team permission, as `ListUserTeamsUseCase` does.
                    const teams = loaded.isOk() ? loaded.value : [];
                    return new Map(teams.map(team => [team.id, team.slug]));
                });
            }
            return teamSlugs;
        };

        return {
            canReadFolder: async (folderId: string): Promise<boolean> => {
                if (folderId !== params.folderId) {
                    return false;
                }
                if (!this.getFlp) {
                    // No stored folder permissions to read once: the folder rules decide alone.
                    const permissions =
                        await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
                    return this.folderLevelPermissions.canAccessFolderContent({
                        permissions,
                        rwd: "r"
                    });
                }
                const stored = await loadStored();
                let withDefaults: FolderPermission[];
                if (this.folderLevelPermissions.canUseTeams()) {
                    /*
                     * A copy of `GetDefaultPermissionsWithTeams` (@webiny/api-aco,
                     * packages/api-aco/src/features/flp/FolderLevelPermissions/useCases/
                     * GetDefaultPermissions/GetDefaultPermissionsWithTeams.ts): each team of the
                     * candidate with a `team:<slug>` permission on the folder grants the candidate
                     * that level, then ACO's `GetDefaultPermissions` applies the defaults.
                     * Copied because ACO loads the current identity's teams once per call, and
                     * each candidate is a separate call; here the teams of all candidates are
                     * loaded once. Keep it in step with that file.
                     */
                    const identity = this.identityContext.getIdentity();
                    const permissions = [...stored];
                    const hasTeamGrants = stored.some(permission => {
                        return permission.target.startsWith(TEAM_TARGET_PREFIX);
                    });
                    const teamIds = usersById.get(identity.id)?.teams ?? [];
                    if (hasTeamGrants && teamIds.length > 0) {
                        const slugs = await loadTeamSlugs();
                        for (const teamId of teamIds) {
                            const slug = slugs.get(teamId);
                            const teamPermission = stored.find(permission => {
                                return permission.target === `${TEAM_TARGET_PREFIX}${slug}`;
                            });
                            if (slug && teamPermission) {
                                permissions.push({
                                    target: `admin:${identity.id}`,
                                    level: teamPermission.level,
                                    inheritedFrom: `${TEAM_TARGET_PREFIX}${slug}`
                                });
                            }
                        }
                    }
                    const defaults = new GetDefaultPermissions(this.identityContext);
                    withDefaults = await defaults.execute(permissions);
                } else {
                    withDefaults = await this.folderLevelPermissions.getDefaultPermissions(stored);
                }
                // In memory: the candidate's own permissions are already loaded for the check.
                return this.folderLevelPermissions.canAccessFolderContent({
                    permissions: withDefaults,
                    rwd: "r"
                });
            }
        };
    }
}

export const CandidateFolderReadRules = Abstraction.createImplementation({
    implementation: CandidateFolderReadRulesImpl,
    dependencies: [
        IdentityContext,
        FolderLevelPermissions,
        ReviewTeamLoader,
        [GetFlpUseCase, { optional: true }]
    ]
});
