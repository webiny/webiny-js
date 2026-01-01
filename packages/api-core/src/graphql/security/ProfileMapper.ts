import { ListGroupsUseCase } from "~/features/security/groups/ListGroups/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import type { AdminUser } from "~/types/users.js";

interface IdentityProfile {
    groups: { id: string; slug: string; name: string }[];
    teams: { id: string; slug: string; name: string }[];
    firstName: string;
    lastName: string;
    avatar?: {
        id: string;
        src: string;
    } | null;
    external: boolean;
    createdOn: string;
}

export class ProfileMapper {
    constructor(
        private listGroups: ListGroupsUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface
    ) {}

    async toDTO(user: AdminUser): Promise<IdentityProfile> {
        const profile: IdentityProfile = {
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            groups: [],
            teams: [],
            avatar: user.avatar,
            external: user.external ?? false,
            createdOn: user.createdOn
        };

        const groupIds = user.groups ?? [];
        if (groupIds.length > 0) {
            const listGroupsResult = await this.listGroups.execute({
                where: { id_in: groupIds }
            });
            if (listGroupsResult.isOk()) {
                profile.groups = listGroupsResult.value.map(group => ({
                    id: group.id,
                    slug: group.slug,
                    name: group.name
                }));
            }
        }

        // Resolve teams
        const teamIds = user.teams ?? [];
        if (teamIds.length > 0) {
            const listTeamsResult = await this.listTeams.execute({
                where: { id_in: teamIds }
            });
            if (listTeamsResult.isOk()) {
                profile.teams = listTeamsResult.value.map(team => ({
                    id: team.id,
                    slug: team.slug,
                    name: team.name
                }));
            }
        }

        return profile;
    }
}
