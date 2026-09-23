import { ListAssumableRolesGateway } from "./abstractions.js";
import { ListAssumableRolesUseCase as Abstraction } from "./abstractions.js";

type RoleDto = ListAssumableRolesGateway.Dto["roles"][number];
type TeamDto = ListAssumableRolesGateway.Dto["teams"][number];

function toRole(role: RoleDto): Abstraction.Role {
    return {
        type: "role",
        id: role.id,
        name: role.name,
        description: role.description ?? "",
        permissions: role.permissions ?? []
    };
}

/*
 * A team grants the union of its roles' permissions, so that is what previewing it shows. Resolved
 * from the role list already fetched rather than with another query per team.
 */
function toTeam(team: TeamDto, roles: RoleDto[]): Abstraction.Role {
    const teamRoleIds = (team.roles ?? []).map(role => role.id);
    const roleIds = new Set(teamRoleIds);
    const teamRoles = roles.filter(role => roleIds.has(role.id));
    const permissions = teamRoles.flatMap(role => role.permissions ?? []);

    return {
        type: "team",
        id: team.id,
        name: team.name,
        description: team.description ?? "",
        permissions
    };
}

class ListAssumableRolesUseCaseImpl implements Abstraction.Interface {
    constructor(private gateway: ListAssumableRolesGateway.Interface) {}

    async execute(params: { includeTeams: boolean }) {
        const dto = await this.gateway.execute(params);

        const roles = dto.roles.map(toRole);
        const teams = dto.teams.map(team => toTeam(team, dto.roles));

        return { roles, teams };
    }
}

export const ListAssumableRolesUseCase = Abstraction.createImplementation({
    implementation: ListAssumableRolesUseCaseImpl,
    dependencies: [ListAssumableRolesGateway]
});
