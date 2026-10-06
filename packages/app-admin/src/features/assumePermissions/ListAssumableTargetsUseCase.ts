import { ListAssumableTargetsGateway } from "./abstractions.js";
import { ListAssumableTargetsUseCase as Abstraction } from "./abstractions.js";

type Entry = ListAssumableTargetsGateway.Dto["roles"][number];

function toRole(role: Entry): Abstraction.Target {
    return { type: "role", id: role.id, name: role.name };
}

function toTeam(team: Entry): Abstraction.Target {
    return { type: "team", id: team.id, name: team.name };
}

class ListAssumableTargetsUseCaseImpl implements Abstraction.Interface {
    constructor(private gateway: ListAssumableTargetsGateway.Interface) {}

    async execute(params: { includeTeams: boolean }) {
        const dto = await this.gateway.execute(params);

        const roles = dto.roles.map(toRole);
        const teams = dto.teams.map(toTeam);

        return { roles, teams };
    }
}

export const ListAssumableTargetsUseCase = Abstraction.createImplementation({
    implementation: ListAssumableTargetsUseCaseImpl,
    dependencies: [ListAssumableTargetsGateway]
});
