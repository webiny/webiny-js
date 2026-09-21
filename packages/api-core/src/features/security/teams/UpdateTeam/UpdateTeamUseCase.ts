import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateTeam } from "./abstractions.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { RolesRepository } from "../../roles/shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { updateTeamValidation } from "./schema.js";
import { TeamBeforeUpdateEvent, TeamAfterUpdateEvent } from "./events.js";
import type { Team, UpdateTeamInput } from "../shared/types.js";
import { descriptionOnUpdate } from "../../shared/description.js";
import { resolveRoleIdentifiers } from "../shared/resolveRoleIdentifiers.js";
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
    private rolesRepository: RolesRepository.Interface;

    constructor(
        repository: TeamsRepository.Interface,
        identityContext: IdentityContext.Interface,
        eventPublisher: EventPublisher.Interface,
        rolesRepository: RolesRepository.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
        this.eventPublisher = eventPublisher;
        this.rolesRepository = rolesRepository;
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

        // `description` is pulled out of the spread because it is the one field that accepts null.
        // Normalising it here keeps null out of both the entity and the published events, whose
        // input type declares `description?: string`.
        const { description, ...rest } = validation.data;

        const changes: UpdateTeamInput = {
            ...rest,
            ...descriptionOnUpdate(description)
        };

        /*
         * Only when the update mentions roles. An update that omits them must leave the stored ones
         * alone, and resolving an absent list would cost a read and write an empty array.
         */
        if (changes.roles) {
            const roleIdsResult = await resolveRoleIdentifiers(this.rolesRepository, changes.roles);

            if (roleIdsResult.isFail()) {
                return Result.fail(roleIdsResult.error);
            }

            changes.roles = roleIdsResult.value;
        }

        const updatedTeam: Team = {
            ...existingTeam,
            ...changes
        };

        await this.eventPublisher.publish(
            new TeamBeforeUpdateEvent({
                original: existingTeam,
                updated: updatedTeam,
                input: changes
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
                input: changes
            })
        );

        return Result.ok(updatedTeam);
    }
}

export const UpdateTeamUseCaseImpl = createImplementation({
    abstraction: UpdateTeam,
    implementation: UpdateTeamUseCase,
    dependencies: [TeamsRepository, IdentityContext, EventPublisher, RolesRepository]
});
