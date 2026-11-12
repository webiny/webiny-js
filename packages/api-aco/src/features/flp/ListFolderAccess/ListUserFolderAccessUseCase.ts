import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";
import {
    ListUserFolderAccessUseCase as UseCaseAbstraction,
    UserFolderCandidates
} from "./abstractions.js";
import type { UserFolderAccessFolder } from "./abstractions.js";
import { ListFlpsUseCase } from "~/features/flp/ListFlps/abstractions.js";
import {
    createAccessDirectory,
    createUserAccessProfile,
    getUserFolderLevel
} from "./userFolderLevel.js";
import { mayAskAboutUser } from "./mayAskAboutUser.js";

/**
 * The folders of the type (or a parent's children), each checked with the user's level (see
 * `getUserFolderLevel`). A user with full access is the owner of every folder, so all are listed;
 * for anyone else, `UserFolderCandidates` may leave out the folders the user's grants cannot reach.
 * The folders' permissions are the ones `ListFlpsUseCase` reports, code-defined ones included.
 */
class ListUserFolderAccessUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private getUser: GetUserUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listRoles: ListRolesUseCase.Interface,
        private listFlps: ListFlpsUseCase.Interface,
        private candidates: UserFolderCandidates.Interface
    ) {}

    async execute({
        userId,
        type,
        parentId
    }: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await mayAskAboutUser(this.identityContext, userId))) {
            return Result.fail(new NotAuthorizedError());
        }

        const flags = this.featureFlags.get();
        if (!flags.isEnabled("advancedAccessControlLayer.folderLevelPermissions")) {
            return Result.ok({ userId, type, restricted: false, folders: [] });
        }
        const teamsEnabled = flags.isEnabled("advancedAccessControlLayer.teams");

        const lookup = await this.identityContext.withoutAuthorization(async () => {
            const [user, teams, roles] = await Promise.all([
                this.getUser.execute({ id: userId }),
                this.listTeams.execute(),
                this.listRoles.execute()
            ]);
            return { user, teams, roles };
        });
        if (lookup.user.isFail()) {
            return Result.fail(lookup.user.error);
        }

        const directory = createAccessDirectory(
            lookup.teams.isOk() ? lookup.teams.value : [],
            lookup.roles.isOk() ? lookup.roles.value : [],
            teamsEnabled
        );
        const profile = createUserAccessProfile(lookup.user.value, directory);

        const flps = profile.hasFullAccess
            ? await this.listFlps.execute({ where: { type, ...(parentId ? { parentId } : {}) } })
            : await this.candidates.list({
                  type,
                  parentId,
                  targets: [
                      `admin:${profile.identity.id}`,
                      ...profile.teams.map(team => `team:${team.slug}`)
                  ]
              });

        const folders: UserFolderAccessFolder[] = [];
        for (const flp of flps) {
            const access = getUserFolderLevel(profile, flp.permissions, teamsEnabled);
            if (access) {
                folders.push({
                    id: flp.id,
                    slug: flp.slug,
                    path: flp.path,
                    parentId: flp.parentId,
                    ...access
                });
            }
        }
        folders.sort((a, b) => a.path.localeCompare(b.path));

        return Result.ok({ userId, type, restricted: true, folders });
    }
}

export const ListUserFolderAccessUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListUserFolderAccessUseCaseImpl,
    dependencies: [
        FeatureFlags,
        IdentityContext,
        GetUserUseCase,
        ListTeamsUseCase,
        ListRolesUseCase,
        ListFlpsUseCase,
        UserFolderCandidates
    ]
});
