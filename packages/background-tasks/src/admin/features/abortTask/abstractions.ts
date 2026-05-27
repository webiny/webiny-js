import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";

export interface IAbortTaskInput {
    id: string;
    message?: string;
}

export interface IAbortTaskGateway {
    execute(input: IAbortTaskInput): Promise<Task>;
}

export const AbortTaskGateway = createAbstraction<IAbortTaskGateway>("AbortTaskGateway");

export namespace AbortTaskGateway {
    export type Interface = IAbortTaskGateway;
}

export interface IAbortTaskUseCase {
    execute(input: IAbortTaskInput): Promise<Task>;
}

export const AbortTaskUseCase = createAbstraction<IAbortTaskUseCase>("AbortTaskUseCase");

export namespace AbortTaskUseCase {
    export type Interface = IAbortTaskUseCase;
}
