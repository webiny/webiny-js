import { Result } from "@webiny/feature/api";
import { DeleteVisibleTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/abstractions.js";
import { TaskNotFoundError } from "~/api/domain/errors.js";

class DeleteVisibleTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly deleteTask: DeleteTaskUseCase.Interface,
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly privateDefinitions: PrivateTaskDefinitions.Interface
    ) {}

    public async execute(id: string) {
        // A private task is refused with the error a missing task gets. A failed read (missing, or
        // any other failure) is refused the same way without deleting: fail closed.
        const task = await this.getTask.execute(id);
        if (task.isFail() || this.privateDefinitions.isPrivate(task.value.definitionId)) {
            return Result.fail(new TaskNotFoundError());
        }
        return this.deleteTask.execute(id);
    }
}

export const DeleteVisibleTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteVisibleTaskUseCaseImpl,
    dependencies: [DeleteTaskUseCase, GetTaskUseCase, PrivateTaskDefinitions]
});
