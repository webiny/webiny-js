import { CleanupTaskSubtreeUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Context } from "~/api/types.js";

export class CleanupTaskSubtreeUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly context: Context) {}

    public async execute(taskId: string): Promise<void> {
        await this.context.tasks.cleanupTaskSubtree(taskId);
    }
}
