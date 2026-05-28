import { createAbstraction } from "@webiny/feature/api";

export interface ICleanupTaskSubtreeUseCase {
    execute(taskId: string): Promise<void>;
}

export const CleanupTaskSubtreeUseCase = createAbstraction<ICleanupTaskSubtreeUseCase>(
    "Tasks/CleanupTaskSubtreeUseCase"
);

export namespace CleanupTaskSubtreeUseCase {
    export type Interface = ICleanupTaskSubtreeUseCase;
}
