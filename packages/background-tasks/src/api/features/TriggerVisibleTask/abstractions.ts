import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ITask } from "~/api/types.js";
import type { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";

type UseCaseError = TriggerTaskUseCase.Error;

export interface ITriggerVisibleTaskUseCase {
    execute(params: TriggerTaskUseCase.Params): Promise<Result<ITask, UseCaseError>>;
}

/**
 * Trigger a task from the GraphQL API. A private definition is refused exactly like an unknown
 * one, so a caller cannot tell the two apart and cannot start it with input of their choice.
 */
export const TriggerVisibleTaskUseCase = createAbstraction<ITriggerVisibleTaskUseCase>(
    "Tasks/TriggerVisibleTaskUseCase"
);

export namespace TriggerVisibleTaskUseCase {
    export type Interface = ITriggerVisibleTaskUseCase;
    export type Error = UseCaseError;
}
