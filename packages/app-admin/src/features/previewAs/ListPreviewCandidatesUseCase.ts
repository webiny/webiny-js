import { ListPreviewCandidatesGateway } from "./abstractions.js";
import { ListPreviewCandidatesUseCase as Abstraction } from "./abstractions.js";

type Entry = ListPreviewCandidatesGateway.Dto["roles"][number];

function toRole(role: Entry): Abstraction.Candidate {
    return { type: "role", id: role.id, name: role.name };
}

function toTeam(team: Entry): Abstraction.Candidate {
    return { type: "team", id: team.id, name: team.name };
}

class ListPreviewCandidatesUseCaseImpl implements Abstraction.Interface {
    constructor(private gateway: ListPreviewCandidatesGateway.Interface) {}

    async execute(params: { includeTeams: boolean }) {
        const dto = await this.gateway.execute(params);

        const roles = dto.roles.map(toRole);
        const teams = dto.teams.map(toTeam);

        return { roles, teams };
    }
}

export const ListPreviewCandidatesUseCase = Abstraction.createImplementation({
    implementation: ListPreviewCandidatesUseCaseImpl,
    dependencies: [ListPreviewCandidatesGateway]
});
