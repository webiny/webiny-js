import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { DeleteTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";
import { TaskAfterDeleteEvent, TaskBeforeDeleteEvent } from "~/api/events/index.js";

class DeleteTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly repository: TasksRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const task = await this.repository.get(id);
        if (task.isFail()) {
            return Result.fail(task.error);
        }

        await this.eventPublisher.publish(new TaskBeforeDeleteEvent({ task: task.value }));

        const result = await this.repository.delete(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new TaskAfterDeleteEvent({ task: task.value }));

        return Result.ok();
    }
}

export const DeleteTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteTaskUseCaseImpl,
    dependencies: [EventPublisher, TasksRepository]
});
