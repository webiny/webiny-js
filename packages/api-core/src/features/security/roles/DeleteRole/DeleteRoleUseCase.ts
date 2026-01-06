import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RolesRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { RoleBeforeDeleteEvent, RoleAfterDeleteEvent } from "./events.js";
import { NotAuthorizedError, CannotDeletePluginRolesError } from "../shared/errors.js";

class DeleteRoleUseCaseImpl implements UseCaseAbstraction.Interface {
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

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.role");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const existingResult = await this.repository.get({ id });
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingRole = existingResult.value;

        // Check if role is created via plugin
        if (existingRole.plugin) {
            return Result.fail(new CannotDeletePluginRolesError());
        }

        await this.eventPublisher.publish(new RoleBeforeDeleteEvent({ role: existingRole }));

        const result = await this.repository.delete(existingRole);

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new RoleAfterDeleteEvent({ role: existingRole }));

        return Result.ok();
    }
}

export const DeleteRoleUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteRoleUseCaseImpl,
    dependencies: [RolesRepository, IdentityContext, EventPublisher]
});
