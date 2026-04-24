import { Result } from "@webiny/feature/api";
import { UpdateRoleUseCase as UseCase } from "./abstractions.js";
import { RolesRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { updateRoleValidation } from "./schema.js";
import { RoleBeforeUpdateEvent, RoleAfterUpdateEvent } from "./events.js";
import type { Role, UpdateRoleInput } from "../shared/types.js";
import {
    NotAuthorizedError,
    CannotUpdatePluginRolesError,
    RoleValidationError
} from "../shared/errors.js";

class UpdateRoleUseCaseImpl implements UseCase.Interface {
    private repository: RolesRepository.Interface;
    private identityContext: IdentityContext.Interface;
    private eventPublisher: EventPublisher.Interface;

    constructor(
        repository: RolesRepository.Interface,
        identityContext: IdentityContext.Interface,
        eventPublisher: EventPublisher.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
        this.eventPublisher = eventPublisher;
    }

    async execute(id: string, input: UpdateRoleInput): Promise<Result<Role, UseCase.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.role");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = updateRoleValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new RoleValidationError(validation.error.issues[0].message));
        }

        const existingResult = await this.repository.get({ id });
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingRole = existingResult.value;

        // Check if role is created via plugin
        if (existingRole.plugin) {
            return Result.fail(new CannotUpdatePluginRolesError());
        }

        const updatedRole: Role = {
            ...existingRole,
            ...validation.data
        };

        await this.eventPublisher.publish(
            new RoleBeforeUpdateEvent({
                original: existingRole,
                updated: updatedRole,
                input: validation.data
            })
        );

        const result = await this.repository.update(updatedRole);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new RoleAfterUpdateEvent({
                original: existingRole,
                updated: updatedRole,
                input: validation.data
            })
        );

        return Result.ok(updatedRole);
    }
}

export const UpdateRoleUseCase = UseCase.createImplementation({
    implementation: UpdateRoleUseCaseImpl,
    dependencies: [RolesRepository, IdentityContext, EventPublisher]
});
