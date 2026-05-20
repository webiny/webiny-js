import { GetTaskGateway, GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

class GetTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetTaskGateway.Interface) {}

    async execute(id: string): Promise<Task> {
        return this.gateway.execute(id);
    }
}

export const GetTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskUseCaseImpl,
    dependencies: [GetTaskGateway]
});
