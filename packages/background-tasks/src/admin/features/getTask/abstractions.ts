import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";

export interface IGetTaskGateway {
    execute(id: string): Promise<Task>;
}

export const GetTaskGateway = createAbstraction<IGetTaskGateway>("GetTaskGateway");

export namespace GetTaskGateway {
    export type Interface = IGetTaskGateway;
}

export interface IGetTaskUseCase {
    execute(id: string): Promise<Task>;
}

export const GetTaskUseCase = createAbstraction<IGetTaskUseCase>("GetTaskUseCase");

export namespace GetTaskUseCase {
    export type Interface = IGetTaskUseCase;
}
