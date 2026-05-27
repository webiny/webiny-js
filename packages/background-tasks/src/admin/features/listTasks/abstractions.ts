import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";

export interface IListTasksInput {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListTasksMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListTasksOutput {
    items: Task[];
    meta: IListTasksMeta;
}

export interface IListTasksGateway {
    execute(input: IListTasksInput): Promise<IListTasksOutput>;
}

export const ListTasksGateway = createAbstraction<IListTasksGateway>("ListTasksGateway");

export namespace ListTasksGateway {
    export type Interface = IListTasksGateway;
}

export interface IListTasksUseCase {
    execute(input: IListTasksInput): Promise<IListTasksOutput>;
}

export const ListTasksUseCase = createAbstraction<IListTasksUseCase>("ListTasksUseCase");

export namespace ListTasksUseCase {
    export type Interface = IListTasksUseCase;
}
