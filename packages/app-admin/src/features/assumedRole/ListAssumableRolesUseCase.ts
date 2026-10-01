import { ListAssumableRolesGateway } from "./abstractions.js";
import { ListAssumableRolesUseCase as Abstraction } from "./abstractions.js";

type Entry = ListAssumableRolesGateway.Dto["roles"][number];

function toRole(role: Entry): Abstraction.Role {
    return { type: "role", id: role.id, name: role.name };
}

function toTeam(team: Entry): Abstraction.Role {
    return { type: "team", id: team.id, name: team.name };
}

class ListAssumableRolesUseCaseImpl implements Abstraction.Interface {
    constructor(private gateway: ListAssumableRolesGateway.Interface) {}

    async execute(params: { includeTeams: boolean }) {
        const dto = await this.gateway.execute(params);

        const roles = dto.roles.map(toRole);
        const teams = dto.teams.map(toTeam);

        return { roles, teams };
    }
}

export const ListAssumableRolesUseCase = Abstraction.createImplementation({
    implementation: ListAssumableRolesUseCaseImpl,
    dependencies: [ListAssumableRolesGateway]
});
