import { Result } from "@webiny/feature/api";
import { GetVisibleTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/abstractions.js";
import { TaskNotFoundError } from "~/api/domain/errors.js";

class GetVisibleTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly privateDefinitions: PrivateTaskDefinitions.Interface
    ) {}

    public async execute(id: string) {
        const result = await this.getTask.execute(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        if (this.privateDefinitions.isPrivate(result.value.definitionId)) {
            return Result.fail(new TaskNotFoundError());
        }
        return Result.ok(result.value);
    }
}

export const GetVisibleTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetVisibleTaskUseCaseImpl,
    dependencies: [GetTaskUseCase, PrivateTaskDefinitions]
});
