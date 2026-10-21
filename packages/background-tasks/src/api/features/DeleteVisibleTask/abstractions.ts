import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DeleteTaskUseCase } from "~/api/features/DeleteTask/abstractions.js";

type UseCaseError = DeleteTaskUseCase.Error;

export interface IDeleteVisibleTaskUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

/** Delete a task from the GraphQL API. A task of a private definition fails like a missing one. */
export const DeleteVisibleTaskUseCase = createAbstraction<IDeleteVisibleTaskUseCase>(
    "Tasks/DeleteVisibleTaskUseCase"
);

export namespace DeleteVisibleTaskUseCase {
    export type Interface = IDeleteVisibleTaskUseCase;
    export type Error = UseCaseError;
}
