import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteTeam } from "./abstractions.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { TeamBeforeDeleteEvent, TeamAfterDeleteEvent } from "./events.js";
import {
    NotAuthorizedError,
    CannotDeletePluginTeamsError,
    CannotDeleteSystemTeamsError
} from "../shared/errors.js";

export class DeleteTeamUseCase {
    private repository: TeamsRepository.Interface;
    private identityContext: IdentityContext.Interface;
    private eventPublisher: EventPublisher.Interface;

    constructor(
        repository: TeamsRepository.Interface,
        identityContext: IdentityContext.Interface,
        eventPublisher: EventPublisher.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
        this.eventPublisher = eventPublisher;
    }

    async execute(id: string): Promise<Result<void, DeleteTeam.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.team");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const existingResult = await this.repository.get({ id });
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingTeam = existingResult.value;

        // Check if team is system team
        if (existingTeam.system) {
            return Result.fail(new CannotDeleteSystemTeamsError());
        }

        // Check if team is created via plugin
        if (existingTeam.plugin) {
            return Result.fail(new CannotDeletePluginTeamsError());
        }

        await this.eventPublisher.publish(new TeamBeforeDeleteEvent({ team: existingTeam }));

        const result = await this.repository.delete(existingTeam);

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new TeamAfterDeleteEvent({ team: existingTeam }));

        return Result.ok();
    }
}

export const DeleteTeamUseCaseImpl = createImplementation({
    abstraction: DeleteTeam,
    implementation: DeleteTeamUseCase,
    dependencies: [TeamsRepository, IdentityContext, EventPublisher]
});
