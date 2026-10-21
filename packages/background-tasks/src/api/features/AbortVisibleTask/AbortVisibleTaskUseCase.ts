import { Result } from "@webiny/feature/api";
import { AbortVisibleTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/abstractions.js";
import { TaskNotFoundError } from "~/api/domain/errors.js";

class AbortVisibleTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly abortTask: AbortTaskUseCase.Interface,
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly privateDefinitions: PrivateTaskDefinitions.Interface
    ) {}

    public async execute(params: AbortTaskUseCase.Params) {
        // A private task is refused with the error a missing task gets. A failed read (missing, or
        // any other failure) is refused the same way without aborting: fail closed.
        const task = await this.getTask.execute(params.id);
        if (task.isFail() || this.privateDefinitions.isPrivate(task.value.definitionId)) {
            return Result.fail(new TaskNotFoundError());
        }
        return this.abortTask.execute(params);
    }
}

export const AbortVisibleTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: AbortVisibleTaskUseCaseImpl,
    dependencies: [AbortTaskUseCase, GetTaskUseCase, PrivateTaskDefinitions]
});
