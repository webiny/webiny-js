import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateTeam } from "./abstractions.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { updateTeamValidation } from "./schema.js";
import { TeamBeforeUpdateEvent, TeamAfterUpdateEvent } from "./events.js";
import type { Team, UpdateTeamInput } from "../shared/types.js";
import {
    NotAuthorizedError,
    CannotUpdatePluginTeamsError,
    CannotUpdateSystemTeamsError,
    TeamValidationError
} from "../shared/errors.js";

export class UpdateTeamUseCase {
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

    async execute(id: string, input: UpdateTeamInput): Promise<Result<Team, UpdateTeam.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.team");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = updateTeamValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new TeamValidationError(validation.error.issues[0].message));
        }

        const existingResult = await this.repository.get({ id });
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingTeam = existingResult.value;

        // Check if team is system team
        if (existingTeam.system) {
            return Result.fail(new CannotUpdateSystemTeamsError());
        }

        // Check if team is created via plugin
        if (existingTeam.plugin) {
            return Result.fail(new CannotUpdatePluginTeamsError());
        }

        const updatedTeam: Team = {
            ...existingTeam,
            ...validation.data
        };

        await this.eventPublisher.publish(
            new TeamBeforeUpdateEvent({
                original: existingTeam,
                updated: updatedTeam,
                input: validation.data
            })
        );

        const result = await this.repository.update(updatedTeam);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new TeamAfterUpdateEvent({
                original: existingTeam,
                updated: updatedTeam,
                input: validation.data
            })
        );

        return Result.ok(updatedTeam);
    }
}

export const UpdateTeamUseCaseImpl = createImplementation({
    abstraction: UpdateTeam,
    implementation: UpdateTeamUseCase,
    dependencies: [TeamsRepository, IdentityContext, EventPublisher]
});
