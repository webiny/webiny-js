import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";
import { GetUserFolderAccessUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetFlpUseCase } from "~/features/flp/GetFlp/abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";
import {
    createAccessDirectory,
    createUserAccessProfile,
    getUserFolderLevel
} from "./userFolderLevel.js";
import { mayAskAboutUser } from "./mayAskAboutUser.js";

/**
 * One folder's permissions (`GetFlpUseCase`, inherited and code-defined ones included) checked with
 * one user's level (see `getUserFolderLevel`), as `ListFolderAccessUseCase` does for every user.
 */
class GetUserFolderAccessUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private getFlp: GetFlpUseCase.Interface,
        private getUser: GetUserUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listRoles: ListRolesUseCase.Interface
    ) {}

    async execute({ userId, folderId }: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await mayAskAboutUser(this.identityContext, userId))) {
            return Result.fail(new NotAuthorizedError());
        }

        const unrestricted = Result.ok({ userId, folderId, restricted: false, canAccess: true });
        const flags = this.featureFlags.get();
        if (
            !folderId ||
            folderId === ROOT_FOLDER ||
            !flags.isEnabled("advancedAccessControlLayer.folderLevelPermissions")
        ) {
            return unrestricted;
        }

        const flp = await this.identityContext.withoutAuthorization(() =>
            this.getFlp.execute(folderId)
        );
        const permissions = flp?.permissions ?? [];
        if (permissions.length === 0) {
            return unrestricted;
        }

        const teamsEnabled = flags.isEnabled("advancedAccessControlLayer.teams");
        const lookup = await this.identityContext.withoutAuthorization(async () => {
            const [user, teams, roles] = await Promise.all([
                this.getUser.execute({ id: userId }),
                teamsEnabled ? this.listTeams.execute() : null,
                this.listRoles.execute()
            ]);
            return { user, teams, roles };
        });
        if (lookup.user.isFail()) {
            return Result.fail(lookup.user.error);
        }

        const directory = createAccessDirectory(
            lookup.teams?.isOk() ? lookup.teams.value : [],
            lookup.roles.isOk() ? lookup.roles.value : [],
            teamsEnabled
        );
        const access = getUserFolderLevel(
            createUserAccessProfile(lookup.user.value, directory),
            permissions,
            teamsEnabled
        );

        return Result.ok({
            userId,
            folderId,
            restricted: true,
            canAccess: !!access,
            ...(access ?? {})
        });
    }
}

export const GetUserFolderAccessUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetUserFolderAccessUseCaseImpl,
    dependencies: [
        FeatureFlags,
        IdentityContext,
        GetFlpUseCase,
        GetUserUseCase,
        ListTeamsUseCase,
        ListRolesUseCase
    ]
});
