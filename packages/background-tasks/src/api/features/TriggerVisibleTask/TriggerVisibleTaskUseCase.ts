import { Result } from "@webiny/feature/api";
import { TriggerVisibleTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/abstractions.js";
import { TaskDefinitionNotFoundError } from "~/api/domain/errors.js";

class TriggerVisibleTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly triggerTask: TriggerTaskUseCase.Interface,
        private readonly getRunnableTaskDefinition: GetRunnableTaskDefinitionUseCase.Interface
    ) {}

    public async execute(params: TriggerTaskUseCase.Params) {
        const definition = this.getRunnableTaskDefinition.execute(params.definition);
        if (definition.isFail() || definition.value.isPrivate) {
            return Result.fail(new TaskDefinitionNotFoundError(params.definition));
        }
        return this.triggerTask.execute(params);
    }
}

export const TriggerVisibleTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerVisibleTaskUseCaseImpl,
    dependencies: [TriggerTaskUseCase, GetRunnableTaskDefinitionUseCase]
});
