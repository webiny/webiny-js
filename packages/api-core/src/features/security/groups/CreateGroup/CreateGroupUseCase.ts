import { mdbid } from "@webiny/utils";
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { CreateGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { createGroupValidation } from "./schema.js";
import { GroupBeforeCreateEvent, GroupAfterCreateEvent } from "./events.js";
import type { Group, CreateGroupInput } from "../shared/types.js";
import { NotAuthorizedError, GroupExistsError, GroupValidationError } from "../shared/errors.js";

class CreateGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: GroupsRepository.Interface
    ) {}

    async execute(input: CreateGroupInput): Promise<Result<Group, UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");

        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = createGroupValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new GroupValidationError(validation.error.errors[0].message));
        }

        const tenant = this.tenantContext.getTenant();
        const identity = this.identityContext.getIdentity();
        const data = validation.data;

        // Check if group with same slug already exists
        const existingGroupResult = await this.repository.get({ slug: data.slug });
        if (existingGroupResult.isOk()) {
            return Result.fail(new GroupExistsError(data.slug));
        }

        const group: Group = {
            id: mdbid(),
            name: data.name,
            slug: data.slug,
            description: data.description,
            permissions: data.permissions,
            system: input.system || false,
            tenant: tenant.id,
            createdOn: new Date().toISOString(),
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            webinyVersion: process.env.WEBINY_VERSION || null,
            plugin: false
        };

        await this.eventPublisher.publish(
            new GroupBeforeCreateEvent({ group, input: validation.data })
        );

        const result = await this.repository.create(group);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new GroupAfterCreateEvent({ group, input: validation.data })
        );

        return Result.ok(group);
    }
}

export const CreateGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateGroupUseCaseImpl,
    dependencies: [TenantContext, IdentityContext, EventPublisher, GroupsRepository]
});
