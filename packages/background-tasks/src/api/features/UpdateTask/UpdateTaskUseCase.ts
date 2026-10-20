import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { UpdateTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";
import { TaskAfterUpdateEvent, TaskBeforeUpdateEvent } from "~/api/events/index.js";

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

class UpdateTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly repository: TasksRepository.Interface
    ) {}

    async execute<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        id: string,
        data: UseCaseAbstraction.Params<I, O>
    ): Promise<Result<TaskService.Task<I, O>, UseCaseAbstraction.Error>> {
        const original = await this.repository.get<I, O>(id);
        if (original.isFail()) {
            return Result.fail(original.error);
        }

        await this.eventPublisher.publish(
            new TaskBeforeUpdateEvent({ input: data, original: original.value })
        );

        const result = await this.repository.update<I, O>(id, data);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new TaskAfterUpdateEvent({ input: data, task: result.value })
        );

        return Result.ok(result.value);
    }
}

export const UpdateTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateTaskUseCaseImpl,
    dependencies: [EventPublisher, TasksRepository]
});
