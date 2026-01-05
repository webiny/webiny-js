import { createImplementation } from "@webiny/feature/api";
import { AfterLoginHandler } from "~/features/security/login/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { UpdateUserUseCase } from "~/features/users/UpdateUser/index.js";

class ExternalIdpUserSyncHandlerImpl implements AfterLoginHandler.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private updateUserUseCase: UpdateUserUseCase.Interface,
        private listRolesUseCase: ListRolesUseCase.Interface,
        private listTeamsUseCase: ListTeamsUseCase.Interface
    ) {}

    async handle(event: AfterLoginHandler.Event): Promise<void> {
        const { identity } = event.payload;

        // We only sync external identities
        if (!identity.profile.external) {
            return;
        }

        await this.identityContext.withoutAuthorization(async () => {
            // Check if user exists
            const getUserResult = await this.getUserUseCase.execute({ id: identity.id });

            // Prepare user data
            const id = identity.id;

            const data = {
                displayName: identity.displayName,
                email: identity.profile.email,
                firstName: identity.profile.firstName || "",
                lastName: identity.profile.lastName || "",
                roles: [] as string[],
                teams: [] as string[],
                external: true
            };

            // Resolve roles
            const roleSlugs = identity.roles;
            if (roleSlugs.length > 0) {
                const listRolesResult = await this.listRolesUseCase.execute({
                    where: { slug_in: roleSlugs }
                });
                if (listRolesResult.isOk()) {
                    data.roles = listRolesResult.value.map(role => role.id);
                }
            }

            // Resolve teams
            const teamSlugs = identity.teams;
            if (teamSlugs.length > 0) {
                const listTeamsResult = await this.listTeamsUseCase.execute({
                    where: { slug_in: teamSlugs }
                });
                if (listTeamsResult.isOk()) {
                    data.teams = listTeamsResult.value.map(team => team.id);
                }
            }

            // Update or create user
            if (getUserResult.isOk()) {
                await this.updateUserUseCase.execute(identity.id, data);
                return;
            }

            await this.createUserUseCase.execute({ id, ...data });
        });
    }
}

export const ExternalIdpUserSyncHandler = createImplementation({
    abstraction: AfterLoginHandler,
    implementation: ExternalIdpUserSyncHandlerImpl,
    dependencies: [
        IdentityContext,
        GetUserUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
        ListRolesUseCase,
        ListTeamsUseCase
    ]
});
