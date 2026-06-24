import { CleanupTaskSubtreeUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { TasksCrud } from "~/api/TasksCrud.js";

export class CleanupTaskSubtreeUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly tasksCrud: TasksCrud.Interface) {}

    public async execute(taskId: string): Promise<void> {
        await this.tasksCrud.cleanupTaskSubtree(taskId);
    }
}
