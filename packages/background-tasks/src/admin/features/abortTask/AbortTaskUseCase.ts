import {
    AbortTaskGateway,
    AbortTaskUseCase as UseCaseAbstraction,
    type IAbortTaskInput
} from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

class AbortTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: AbortTaskGateway.Interface) {}

    async execute(input: IAbortTaskInput): Promise<Task> {
        return this.gateway.execute(input);
    }
}

export const AbortTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: AbortTaskUseCaseImpl,
    dependencies: [AbortTaskGateway]
});
