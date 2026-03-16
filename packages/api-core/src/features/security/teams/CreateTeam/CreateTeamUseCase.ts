import { mdbid } from "@webiny/utils";
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { CreateTeam } from "./abstractions.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { createTeamValidation } from "./schema.js";
import { TeamBeforeCreateEvent, TeamAfterCreateEvent } from "./events.js";
import type { Team, CreateTeamInput } from "../shared/types.js";
import { NotAuthorizedError, TeamExistsError, TeamValidationError } from "../shared/errors.js";

export class CreateTeamUseCase implements CreateTeam.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: TeamsRepository.Interface
    ) {}

    async execute(input: CreateTeamInput): Promise<Result<Team, CreateTeam.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.team");

        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = createTeamValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new TeamValidationError(validation.error.issues[0].message));
        }

        const tenant = this.tenantContext.getTenant();
        const identity = this.identityContext.getIdentity();
        const data = validation.data;

        // Check if team with same slug already exists
        const existingTeamResult = await this.repository.get({ slug: data.slug });
        if (existingTeamResult.isOk()) {
            return Result.fail(new TeamExistsError(data.slug));
        }

        const team: Team = {
            id: mdbid(),
            name: data.name,
            slug: data.slug,
            description: data.description,
            roles: data.roles,
            system: input.system || false,
            tenant: tenant.id,
            createdOn: new Date().toISOString(),
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            plugin: false
        };

        await this.eventPublisher.publish(
            new TeamBeforeCreateEvent({ team, input: validation.data })
        );

        const result = await this.repository.create(team);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new TeamAfterCreateEvent({ team, input: validation.data })
        );

        return Result.ok(team);
    }
}

export const CreateTeamUseCaseImpl = createImplementation({
    abstraction: CreateTeam,
    implementation: CreateTeamUseCase,
    dependencies: [TenantContext, IdentityContext, EventPublisher, TeamsRepository]
});
