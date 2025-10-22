import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateGroup } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { updateGroupValidation } from "./schema.js";
import { GroupBeforeUpdateEvent, GroupAfterUpdateEvent } from "./events.js";
import type { Group, UpdateGroupInput } from "../shared/types.js";
import { NotAuthorizedError, CannotUpdatePluginGroupsError } from "../shared/errors.js";

export class UpdateGroupUseCase {
    private repository: GroupsRepository.Interface;
    private identityContext: IdentityContext.Interface;
    private eventPublisher: EventPublisher.Interface;

    constructor(
        repository: GroupsRepository.Interface,
        identityContext: IdentityContext.Interface,
        eventPublisher: EventPublisher.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
        this.eventPublisher = eventPublisher;
    }

    async execute(id: string, input: UpdateGroupInput): Promise<Result<Group, UpdateGroup.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = updateGroupValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new Error(validation.error.errors[0].message));
        }

        const existingResult = await this.repository.get({ id });
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingGroup = existingResult.value;

        // Check if group is created via plugin
        if (existingGroup.plugin) {
            return Result.fail(new CannotUpdatePluginGroupsError());
        }

        const updatedGroup: Group = {
            ...existingGroup,
            ...validation.data
        };

        await this.eventPublisher.publish(
            new GroupBeforeUpdateEvent({
                original: existingGroup,
                updated: updatedGroup,
                input: validation.data
            })
        );

        const result = await this.repository.update(updatedGroup);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new GroupAfterUpdateEvent({
                original: existingGroup,
                updated: updatedGroup,
                input: validation.data
            })
        );

        return Result.ok(updatedGroup);
    }
}

export const UpdateGroupUseCaseImpl = createImplementation({
    abstraction: UpdateGroup,
    implementation: UpdateGroupUseCase,
    dependencies: [GroupsRepository, IdentityContext, EventPublisher]
});
