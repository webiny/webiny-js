import { createImplementation } from "@webiny/feature/api";
import { AfterLoginHandler } from "~/features/security/login/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { ListGroupsUseCase } from "~/features/security/groups/ListGroups/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { GetUserUseCase } from "~/features/GetUser/index.js";
import { CreateUserUseCase } from "~/features/CreateUser/index.js";
import { UpdateUserUseCase } from "~/features/UpdateUser/index.js";

class ExternalIdpUserSyncHandlerImpl implements AfterLoginHandler.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private updateUserUseCase: UpdateUserUseCase.Interface,
        private listGroupsUseCase: ListGroupsUseCase.Interface,
        private listTeamsUseCase: ListTeamsUseCase.Interface
    ) {}

    async handle(event: AfterLoginHandler.Event): Promise<void> {
        const { identity } = event.payload;

        await this.identityContext.withoutAuthorization(async () => {
            // Check if user exists
            const getUserResult = await this.getUserUseCase.execute({ id: identity.id });

            // Prepare user data
            const id = identity.id;
            const identityData = identity as any;
            const email = identityData.email || `id:${id}`;
            const displayName = identity.displayName || "Missing display name";

            const data = {
                displayName,
                email,
                firstName: identityData.firstName || "",
                lastName: identityData.lastName || "",
                groups: [] as string[],
                teams: [] as string[],
                external: true
            };

            // Collect group slugs
            let groupSlugs: string[] = [];
            if (identityData.group) {
                groupSlugs = [identityData.group];
            }

            if (Array.isArray(identityData.groups)) {
                groupSlugs = groupSlugs.concat(identityData.groups);
            }

            // Collect team slugs
            let teamSlugs: string[] = [];
            if (identityData.team) {
                teamSlugs = [identityData.team];
            }

            if (Array.isArray(identityData.teams)) {
                teamSlugs = teamSlugs.concat(identityData.teams);
            }

            // Resolve groups
            if (groupSlugs.length > 0) {
                const listGroupsResult = await this.listGroupsUseCase.execute({
                    where: { slug_in: groupSlugs }
                });
                if (listGroupsResult.isOk()) {
                    data.groups = listGroupsResult.value.map(group => group.id);
                }
            }

            // Resolve teams
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
        ListGroupsUseCase,
        ListTeamsUseCase
    ]
});
