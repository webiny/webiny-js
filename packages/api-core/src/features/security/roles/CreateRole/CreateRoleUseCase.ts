import { mdbid } from "@webiny/utils";
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { CreateRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RolesRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { createRoleValidation } from "./schema.js";
import { RoleBeforeCreateEvent, RoleAfterCreateEvent } from "./events.js";
import type { Role, CreateRoleInput } from "../shared/types.js";
import { NotAuthorizedError, RoleExistsError, RoleValidationError } from "../shared/errors.js";
import { descriptionOnCreate } from "../../shared/description.js";

class CreateRoleUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: RolesRepository.Interface
    ) {}

    async execute(input: CreateRoleInput): Promise<Result<Role, UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.role");

        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = createRoleValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new RoleValidationError(validation.error.issues[0].message));
        }

        const identity = this.identityContext.getIdentity();
        const data = validation.data;

        // Check if role with same slug already exists
        const existingRoleResult = await this.repository.get({ slug: data.slug });
        if (existingRoleResult.isOk()) {
            return Result.fail(new RoleExistsError(data.slug));
        }

        // Normalised up front so that null reaches neither the entity nor the published events.
        const createInput: CreateRoleInput = {
            ...data,
            description: descriptionOnCreate(data.description)
        };

        const role: Role = {
            id: mdbid(),
            name: createInput.name,
            slug: createInput.slug,
            description: descriptionOnCreate(createInput.description),
            permissions: createInput.permissions,
            system: input.system || false,
            createdOn: new Date().toISOString(),
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            plugin: false
        };

        await this.eventPublisher.publish(new RoleBeforeCreateEvent({ role, input: createInput }));

        const result = await this.repository.create(role);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new RoleAfterCreateEvent({ role, input: createInput }));

        return Result.ok(role);
    }
}

export const CreateRoleUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateRoleUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, RolesRepository]
});
