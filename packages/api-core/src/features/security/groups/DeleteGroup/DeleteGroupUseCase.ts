import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { GroupBeforeDeleteEvent, GroupAfterDeleteEvent } from "./events.js";
import { NotAuthorizedError, CannotDeletePluginGroupsError } from "../shared/errors.js";

class DeleteGroupUseCaseImpl implements UseCaseAbstraction.Interface {
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

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const existingResult = await this.repository.get({ id });
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingGroup = existingResult.value;

        // Check if group is created via plugin
        if (existingGroup.plugin) {
            return Result.fail(new CannotDeletePluginGroupsError());
        }

        await this.eventPublisher.publish(new GroupBeforeDeleteEvent({ group: existingGroup }));

        const result = await this.repository.delete(existingGroup);

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new GroupAfterDeleteEvent({ group: existingGroup }));

        return Result.ok();
    }
}

export const DeleteGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteGroupUseCaseImpl,
    dependencies: [GroupsRepository, IdentityContext, EventPublisher]
});
